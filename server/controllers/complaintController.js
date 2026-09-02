const Complaint = require('../models/Complaint');
const { calculatePriority, validatePriorityInputs } = require('../utils/priorityEngine');
const {
  MIN_RELATIONSHIP_SCORE_TO_STORE,
  CANDIDATE_LIMIT,
  buildCandidateQuery,
  calculateRelatedIssueSimilarity,
  toRelationshipRecord
} = require('../utils/relatedIssueEngine');

const privilegedRoles = new Set(['MUNICIPAL_OFFICIAL', 'ADMIN']);

const isOwner = (user, complaint) => {
  if (!user || !complaint?.reportedBy) {
    return false;
  }

  return complaint.reportedBy.toString() === user._id.toString();
};

const canViewComplaint = (user, complaint) => {
  if (!user) {
    return true;
  }

  if (privilegedRoles.has(user.role)) {
    return true;
  }

  return isOwner(user, complaint);
};

const canCitizenManageOwnComplaint = (user, complaint) => {
  return user?.role === 'CITIZEN' && isOwner(user, complaint);
};

const canOperationalManageComplaint = (user) => {
  return Boolean(user && privilegedRoles.has(user.role));
};

const serializeComplaint = (complaint, user, includeReportedBy = false) => {
  const plainComplaint = complaint.toObject ? complaint.toObject() : complaint;

  if (!includeReportedBy && (!user || user.role === 'CITIZEN')) {
    delete plainComplaint.reportedBy;
  }

  if (!user || user.role === 'CITIZEN') {
    delete plainComplaint.relatedIssues;
  }

  return plainComplaint;
};

const dedupeRelationships = (relationships) => {
  const map = new Map();

  for (const relation of relationships) {
    const key = String(relation.complaintId);
    const existing = map.get(key);

    if (!existing || relation.similarityScore > existing.similarityScore) {
      map.set(key, relation);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.similarityScore - a.similarityScore);
};

const upsertReverseRelationship = async (targetComplaintId, sourceComplaintId, relation) => {
  await Complaint.updateOne(
    { _id: targetComplaintId },
    {
      $pull: {
        relatedIssues: {
          complaintId: sourceComplaintId
        }
      }
    }
  );

  await Complaint.updateOne(
    { _id: targetComplaintId },
    {
      $push: {
        relatedIssues: {
          complaintId: sourceComplaintId,
          similarityScore: relation.similarityScore,
          relationshipLevel: relation.relationshipLevel,
          breakdown: relation.breakdown,
          explanation: relation.explanation,
          distanceKm: relation.distanceKm,
          calculatedAt: new Date()
        }
      }
    }
  );
};

const detectAndStoreRelatedIssues = async (complaint) => {
  const candidateQuery = buildCandidateQuery(complaint);
  const candidates = await Complaint.find(candidateQuery)
    .select('_id title description category createdAt location reportedBy')
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_LIMIT);

  const matchedRelations = [];

  for (const candidate of candidates) {
    const similarity = calculateRelatedIssueSimilarity(complaint, candidate);
    if (similarity.similarityScore < MIN_RELATIONSHIP_SCORE_TO_STORE) {
      continue;
    }

    matchedRelations.push(toRelationshipRecord(candidate, similarity));
  }

  complaint.relatedIssues = dedupeRelationships(matchedRelations);
  await complaint.save();

  for (const relation of complaint.relatedIssues) {
    await upsertReverseRelationship(relation.complaintId, complaint._id, relation);
  }
};

const hydrateRelatedIssues = async (baseComplaint, user) => {
  const relationships = Array.isArray(baseComplaint.relatedIssues) ? baseComplaint.relatedIssues : [];

  if (relationships.length === 0) {
    return [];
  }

  const relatedIds = relationships.map((relation) => relation.complaintId);
  const relatedComplaints = await Complaint.find({ _id: { $in: relatedIds } })
    .select('_id title category location reportedBy status createdAt')
    .lean();

  const relatedMap = new Map(relatedComplaints.map((item) => [String(item._id), item]));

  return relationships
    .map((relation) => {
      const target = relatedMap.get(String(relation.complaintId));
      if (!target) {
        return null;
      }

      if (user.role === 'CITIZEN' && String(target.reportedBy || '') !== String(user._id)) {
        return null;
      }

      const result = {
        complaintId: target._id,
        similarityScore: relation.similarityScore,
        relationshipLevel: relation.relationshipLevel,
        breakdown: relation.breakdown,
        explanation: relation.explanation,
        distanceKm: relation.distanceKm,
        calculatedAt: relation.calculatedAt,
        complaint: {
          title: target.title,
          category: target.category,
          areaName: target.location?.areaName || '',
          status: target.status,
          createdAt: target.createdAt
        }
      };

      return result;
    })
    .filter(Boolean)
    .sort((a, b) => b.similarityScore - a.similarityScore);
};

const applyPriorityCalculation = (complaint, now = new Date()) => {
  const calculated = calculatePriority(complaint, now);

  complaint.priorityScore = calculated.priorityScore;
  complaint.priorityLevel = calculated.priorityLevel;
  complaint.priorityBreakdown = calculated.priorityBreakdown;
  complaint.priorityExplanation = calculated.priorityExplanation;
  complaint.priorityCalculatedAt = calculated.priorityCalculatedAt;
  complaint.priority = calculated.priorityLevel.toLowerCase();

  return complaint;
};

const normalizeFactorPayload = (payload = {}) => {
  const normalized = { ...payload };

  if (normalized.safetyRisk !== undefined) {
    normalized.safetyRisk = String(normalized.safetyRisk).trim().toLowerCase();
  }

  if (normalized.environmentalImpact !== undefined) {
    normalized.environmentalImpact = String(normalized.environmentalImpact).trim().toLowerCase();
  }

  if (normalized.locationSensitivity !== undefined) {
    normalized.locationSensitivity = String(normalized.locationSensitivity).trim().toLowerCase();
  }

  if (normalized.peopleAffected !== undefined) {
    normalized.peopleAffected = Number(normalized.peopleAffected);
  }

  return normalized;
};

const badRequest = (res, message) => {
  return res.status(400).json({
    success: false,
    message
  });
};

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const user = req.user;

    if (!user || user.role !== 'CITIZEN') {
      return res.status(403).json({
        success: false,
        message: 'Only citizens can create complaints'
      });
    }

    const validationErrors = validatePriorityInputs(req.body);
    if (validationErrors.length > 0) {
      return badRequest(res, validationErrors[0]);
    }

    const normalizedPriorityFactors = normalizeFactorPayload(req.body);

    const {
      title,
      description,
      category,
      location,
      assignedTeam,
    } = req.body;

    const complaint = new Complaint({
      title,
      description,
      category,
      status: 'pending',
      reportedBy: user._id,
      safetyRisk: normalizedPriorityFactors.safetyRisk || 'none',
      environmentalImpact: normalizedPriorityFactors.environmentalImpact || 'none',
      peopleAffected: Number.isFinite(normalizedPriorityFactors.peopleAffected) ? normalizedPriorityFactors.peopleAffected : 0,
      locationSensitivity: normalizedPriorityFactors.locationSensitivity || 'normal_residential',
      location: {
        areaName: location?.areaName || '',
        coordinates: {
          latitude: location?.coordinates?.latitude,
          longitude: location?.coordinates?.longitude
        }
      },
      assignedTeam: assignedTeam || { name: '', members: [] }
    });

    applyPriorityCalculation(complaint);
    await complaint.save();
    await detectAndStoreRelatedIssues(complaint);

    res.status(201).json({
      success: true,
      complaint: serializeComplaint(complaint, user, true)
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating complaint'
    });
  }
};

// Get all complaints with optional filters
exports.getComplaints = async (req, res) => {
  try {
    const { category, status, priority, search } = req.query;
    const user = req.user;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.areaName': { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints: complaints.map((complaint) => serializeComplaint(complaint, user))
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const user = req.user;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!canViewComplaint(user, complaint)) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      complaint: serializeComplaint(complaint, user, Boolean(user && privilegedRoles.has(user.role)))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update complaint (status, priority, assignedTeam, etc.)
exports.updateComplaint = async (req, res) => {
  try {
    const user = req.user;
    const normalizedPayload = normalizeFactorPayload(req.body);
    const { status, location, assignedTeam, safetyRisk, environmentalImpact, peopleAffected, locationSensitivity } = normalizedPayload;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (user.role === 'CITIZEN') {
      return res.status(403).json({
        success: false,
        message: 'Citizens cannot update complaints'
      });
    }

    if (user.role === 'MUNICIPAL_OFFICIAL') {
      const requestedNonStatusFields = [location, assignedTeam, safetyRisk, environmentalImpact, peopleAffected, locationSensitivity].some((value) => value !== undefined);

      if (requestedNonStatusFields) {
        return res.status(403).json({
          success: false,
          message: 'Municipal officials can only update complaint status'
        });
      }
    }

    if (user.role === 'ADMIN') {
      const validationErrors = validatePriorityInputs({ safetyRisk, environmentalImpact, peopleAffected, locationSensitivity });
      if (validationErrors.length > 0) {
        return badRequest(res, validationErrors[0]);
      }
    }

    if (status) complaint.status = status;
    if (location) {
      if (location.areaName !== undefined) complaint.location.areaName = location.areaName;
      if (location.coordinates) {
        if (location.coordinates.latitude) complaint.location.coordinates.latitude = location.coordinates.latitude;
        if (location.coordinates.longitude) complaint.location.coordinates.longitude = location.coordinates.longitude;
      }
    }
    if (assignedTeam) {
      if (assignedTeam.name !== undefined) complaint.assignedTeam.name = assignedTeam.name;
      if (assignedTeam.members) complaint.assignedTeam.members = assignedTeam.members;
    }

    if (user.role === 'ADMIN') {
      if (safetyRisk !== undefined) complaint.safetyRisk = safetyRisk;
      if (environmentalImpact !== undefined) complaint.environmentalImpact = environmentalImpact;
      if (peopleAffected !== undefined) complaint.peopleAffected = peopleAffected;
      if (locationSensitivity !== undefined) complaint.locationSensitivity = locationSensitivity;
      applyPriorityCalculation(complaint);
    }

    await complaint.save();

    res.json({
      success: true,
      complaint: serializeComplaint(complaint, user, Boolean(privilegedRoles.has(user.role))),
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.calculateComplaintPriority = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !privilegedRoles.has(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only municipal officials and admins can recalculate priority'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    applyPriorityCalculation(complaint);
    await complaint.save();

    res.json({
      success: true,
      complaint: serializeComplaint(complaint, user, Boolean(privilegedRoles.has(user.role))),
      message: 'Priority recalculated successfully'
    });
  } catch (error) {
    console.error('Calculate priority error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recalculate priority'
    });
  }
};

exports.getRelatedComplaints = async (req, res) => {
  try {
    const user = req.user;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!canViewComplaint(user, complaint)) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const related = await hydrateRelatedIssues(complaint, user);

    res.json({
      success: true,
      complaintId: complaint._id,
      relatedIssues: related,
      strategy: 'rule_based_similarity_analysis'
    });
  } catch (error) {
    console.error('Get related complaints error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load related complaints'
    });
  }
};

// Add an update to the updates array
exports.addUpdate = async (req, res) => {
  try {
    const user = req.user;
    const { status, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!(canCitizenManageOwnComplaint(user, complaint) || canOperationalManageComplaint(user))) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add updates to this complaint'
      });
    }

    const updateStatus = user.role === 'CITIZEN' ? complaint.status : (status || complaint.status);

    complaint.updates.unshift({
      status: updateStatus,
      comment: comment || '',
      updatedAt: new Date()
    });

    if (status && user.role !== 'CITIZEN') {
      complaint.status = status;
    }

    await complaint.save();

    res.json({
      success: true,
      complaint: serializeComplaint(complaint, user, Boolean(privilegedRoles.has(user.role))),
      message: 'Update added successfully'
    });
  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add an image to the images array
exports.addImage = async (req, res) => {
  try {
    const user = req.user;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (!(canCitizenManageOwnComplaint(user, complaint) || canOperationalManageComplaint(user))) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add images to this complaint'
      });
    }

    complaint.images.unshift({
      url,
      uploadedAt: new Date()
    });

    await complaint.save();

    res.json({
      success: true,
      complaint: serializeComplaint(complaint, user, Boolean(privilegedRoles.has(user.role))),
      message: 'Image added successfully'
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const user = req.user;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete complaints'
      });
    }

    await complaint.deleteOne();

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
