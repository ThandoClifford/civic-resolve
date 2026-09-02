const RELATED_ISSUE_THRESHOLDS = {
  UNRELATED: { min: 0, max: 29 },
  POSSIBLY_RELATED: { min: 30, max: 59 },
  LIKELY_RELATED: { min: 60, max: 79 },
  STRONGLY_RELATED: { min: 80, max: 100 }
};

const RELATED_ISSUE_WEIGHTS = {
  geographic: 35,
  category: 25,
  text: 25,
  time: 15
};

const MIN_RELATIONSHIP_SCORE_TO_STORE = 30;
const CANDIDATE_TIME_WINDOW_DAYS = 180;
const CANDIDATE_COORDINATE_DELTA = 0.5;
const CANDIDATE_LIMIT = 150;

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'is', 'are', 'was', 'were', 'of', 'to', 'in', 'on', 'at',
  'for', 'with', 'by', 'from', 'near', 'outside', 'inside', 'this', 'that', 'it', 'as',
  'be', 'been', 'being', 'there', 'here', 'into', 'over', 'under', 'about', 'around',
  'issue', 'problem', 'complaint', 'reported', 'report'
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) {
    return Number.POSITIVE_INFINITY;
  }

  const lat1 = Number(pointA.latitude);
  const lon1 = Number(pointA.longitude);
  const lat2 = Number(pointB.latitude);
  const lon2 = Number(pointB.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const tokenize = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
};

const jaccardSimilarity = (textA, textB) => {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));

  if (tokensA.size === 0 && tokensB.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  if (unionCount === 0) {
    return 0;
  }

  return intersectionCount / unionCount;
};

const scoreGeographicProximity = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return 0;
  }

  if (distanceKm <= 0.2) return 35;
  if (distanceKm <= 1) return 30;
  if (distanceKm <= 3) return 24;
  if (distanceKm <= 5) return 18;
  if (distanceKm <= 10) return 10;
  if (distanceKm <= 20) return 5;
  return 0;
};

const scoreCategorySimilarity = (categoryA, categoryB) => {
  if (!categoryA || !categoryB) {
    return 0;
  }

  if (String(categoryA).trim().toLowerCase() === String(categoryB).trim().toLowerCase()) {
    return 25;
  }

  return 4;
};

const scoreTextSimilarity = (complaintA, complaintB) => {
  const combinedA = `${complaintA?.title || ''} ${complaintA?.description || ''}`;
  const combinedB = `${complaintB?.title || ''} ${complaintB?.description || ''}`;
  const similarity = jaccardSimilarity(combinedA, combinedB);

  return Math.round(similarity * RELATED_ISSUE_WEIGHTS.text);
};

const scoreTimeProximity = (createdAtA, createdAtB) => {
  const a = createdAtA ? new Date(createdAtA) : null;
  const b = createdAtB ? new Date(createdAtB) : null;

  if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return 0;
  }

  const diffInDays = Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);

  if (diffInDays <= 1) return 15;
  if (diffInDays <= 3) return 12;
  if (diffInDays <= 7) return 9;
  if (diffInDays <= 14) return 6;
  if (diffInDays <= 30) return 3;
  return 0;
};

const getRelationshipLevel = (score) => {
  if (score >= RELATED_ISSUE_THRESHOLDS.STRONGLY_RELATED.min) {
    return 'STRONGLY_RELATED';
  }

  if (score >= RELATED_ISSUE_THRESHOLDS.LIKELY_RELATED.min) {
    return 'LIKELY_RELATED';
  }

  if (score >= RELATED_ISSUE_THRESHOLDS.POSSIBLY_RELATED.min) {
    return 'POSSIBLY_RELATED';
  }

  return 'UNRELATED';
};

const buildRelationshipExplanation = ({ score, relationshipLevel, breakdown }) => {
  const factors = [];

  if (breakdown.geographic >= 18) {
    factors.push('are geographically close');
  }

  if (breakdown.category >= 20) {
    factors.push('share the same category');
  }

  if (breakdown.text >= 12) {
    factors.push('contain similar wording in title and description');
  }

  if (breakdown.time >= 9) {
    factors.push('were submitted close together in time');
  }

  if (factors.length === 0) {
    return `These complaints are marked as ${relationshipLevel} (${score}/100) with limited overlap across the configured similarity factors.`;
  }

  if (factors.length === 1) {
    return `These complaints are marked as ${relationshipLevel} (${score}/100) because they ${factors[0]}.`;
  }

  const lastFactor = factors.pop();
  return `These complaints are marked as ${relationshipLevel} (${score}/100) because they ${factors.join(', ')}, and ${lastFactor}.`;
};

const calculateRelatedIssueSimilarity = (sourceComplaint, candidateComplaint) => {
  const sourceCoords = sourceComplaint?.location?.coordinates;
  const candidateCoords = candidateComplaint?.location?.coordinates;
  const distanceKm = haversineDistanceKm(sourceCoords, candidateCoords);

  const breakdown = {
    geographic: scoreGeographicProximity(distanceKm),
    category: scoreCategorySimilarity(sourceComplaint?.category, candidateComplaint?.category),
    text: scoreTextSimilarity(sourceComplaint, candidateComplaint),
    time: scoreTimeProximity(sourceComplaint?.createdAt, candidateComplaint?.createdAt)
  };

  const similarityScore = clamp(
    breakdown.geographic + breakdown.category + breakdown.text + breakdown.time,
    0,
    100
  );

  const relationshipLevel = getRelationshipLevel(similarityScore);

  return {
    similarityScore,
    relationshipLevel,
    breakdown,
    explanation: buildRelationshipExplanation({
      score: similarityScore,
      relationshipLevel,
      breakdown
    }),
    distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : null
  };
};

const buildCandidateQuery = (complaint, now = new Date()) => {
  const query = {
    _id: { $ne: complaint._id }
  };

  const latitude = Number(complaint?.location?.coordinates?.latitude);
  const longitude = Number(complaint?.location?.coordinates?.longitude);
  const hasValidCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const recentBoundary = new Date(now.getTime() - CANDIDATE_TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  if (hasValidCoordinates) {
    query.$or = [
      {
        category: complaint.category,
        createdAt: { $gte: recentBoundary }
      },
      {
        'location.coordinates.latitude': {
          $gte: latitude - CANDIDATE_COORDINATE_DELTA,
          $lte: latitude + CANDIDATE_COORDINATE_DELTA
        },
        'location.coordinates.longitude': {
          $gte: longitude - CANDIDATE_COORDINATE_DELTA,
          $lte: longitude + CANDIDATE_COORDINATE_DELTA
        }
      }
    ];
  } else {
    query.createdAt = { $gte: recentBoundary };
  }

  return query;
};

const toRelationshipRecord = (candidate, similarity) => ({
  complaintId: candidate._id,
  similarityScore: similarity.similarityScore,
  relationshipLevel: similarity.relationshipLevel,
  breakdown: similarity.breakdown,
  explanation: similarity.explanation,
  distanceKm: similarity.distanceKm,
  calculatedAt: new Date()
});

module.exports = {
  RELATED_ISSUE_THRESHOLDS,
  RELATED_ISSUE_WEIGHTS,
  MIN_RELATIONSHIP_SCORE_TO_STORE,
  CANDIDATE_LIMIT,
  CANDIDATE_TIME_WINDOW_DAYS,
  buildCandidateQuery,
  calculateRelatedIssueSimilarity,
  toRelationshipRecord
};