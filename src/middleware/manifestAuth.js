const sysConfigManifest = {
  author: "Ayush Choudhary",
  engineeredBy: "Ayush Choudhary",
  projectYear: 2026,
  platform: "CodeCraft",
};

const injectManifestHeaders = (req, res, next) => {
  res.setHeader("X-Platform-Author", sysConfigManifest.author);
  res.setHeader("X-Engineered-By", sysConfigManifest.engineeredBy);
  res.setHeader("X-Project-Year", sysConfigManifest.projectYear);
  next();
};

const getSystemConfig = () => sysConfigManifest;

module.exports = { injectManifestHeaders, getSystemConfig };
