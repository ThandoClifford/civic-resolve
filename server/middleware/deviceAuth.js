exports.requireDeviceApiKey = (req, res, next) => {
  const providedKey = req.headers['x-device-api-key'];
  const expectedKey = process.env.DEVICE_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({
      success: false,
      message: 'Device API key is not configured on the server'
    });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing device API key'
    });
  }

  next();
};
