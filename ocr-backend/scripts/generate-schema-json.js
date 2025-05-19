const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Document = require('../models/Document');
const IdCard = require('../models/IdCard');
const OfficialDocument = require('../models/OfficialDocument');

// Helper function to extract schema information from a Mongoose schema
function extractSchema(mongooseSchema) {
  const result = {};
  
  // Process all fields in the schema
  Object.keys(mongooseSchema.paths).forEach(path => {
    // Skip __v and _id fields
    if (path === '__v' || path === '_id') return;
    
    const schemaType = mongooseSchema.paths[path];
    const fieldInfo = {};
    
    // Get the type
    if (schemaType.instance === 'ObjectID' && schemaType.options.ref) {
      fieldInfo.type = 'ObjectId';
      fieldInfo.ref = schemaType.options.ref;
    } else if (schemaType.instance === 'Array' && schemaType.schema) {
      fieldInfo.type = 'Array';
      fieldInfo.items = extractSchema(schemaType.schema);
    } else if (schemaType.instance === 'Mixed') {
      fieldInfo.type = 'Mixed';
    } else {
      fieldInfo.type = schemaType.instance;
    }
    
    // Add the field to the result
    result[path] = fieldInfo;
  });
  
  return result;
}

// Create schema object
const schema = {
  User: extractSchema(User.schema),
  Document: extractSchema(Document.schema),
  IdCard: extractSchema(IdCard.schema),
  OfficialDocument: extractSchema(OfficialDocument.schema)
};

// Add references manually if not detected
schema.Document.userId.ref = 'User';
schema.Document.user.ref = 'User';
schema.IdCard.user.ref = 'User';
schema.OfficialDocument.user.ref = 'User';

// Write schema to file
const outputPath = path.join(__dirname, '../model-schema.json');
fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));

console.log(`Schema exported to ${outputPath}`); 