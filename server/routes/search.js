// routes/search.js
const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Search across all entities
router.get('/', (req, res) => {
  try {
    const { query, tags, type } = req.query;
    
    // Initialize search results object
    const results = {
      garages: [],
      bikes: [],
      sections: [],
      parts: []
    };
    
    // Only search specific entity types if specified
    const searchTypes = type ? [type] : ['garage', 'bike', 'section', 'part'];
    
    // Base search conditions - search by name and description
    const searchConditions = query ? `name LIKE '%${query}%' OR description LIKE '%${query}%' OR notes LIKE '%${query}%'` : '1=1';
    
    // If tags are provided, filter by tags
    let taggedItemIds = {};
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      
      // For each entity type, get items that have all the specified tags
      searchTypes.forEach(type => {
        // We need to ensure items have ALL the specified tags
        const tagCounts = db.prepare(`
          SELECT ti.item_id, COUNT(ti.tag_id) as tag_count
          FROM tagged_items ti
          JOIN tags t ON ti.tag_id = t.id
          WHERE ti.item_type = ? AND t.name IN (${tagArray.map(() => '?').join(',')})
          GROUP BY ti.item_id
          HAVING tag_count = ?
        `).all(type, ...tagArray, tagArray.length);
        
        taggedItemIds[type] = tagCounts.map(item => item.item_id);
      });
    }
    
    // Execute searches for each entity type
    if (searchTypes.includes('garage') && (!tags || taggedItemIds.garage.length > 0)) {
      const garageSql = `
        SELECT * FROM garages 
        WHERE (${searchConditions})
        ${tags ? `AND id IN (${taggedItemIds.garage.join(',') || 0})` : ''}
        ORDER BY name
      `;
      results.garages = db.prepare(garageSql).all();
    }
    
    if (searchTypes.includes('bike') && (!tags || taggedItemIds.bike.length > 0)) {
      const bikeSql = `
        SELECT b.*, g.name as garage_name
        FROM bikes b
        JOIN garages g ON b.garage_id = g.id
        WHERE (${searchConditions.replace(/name/g, 'b.name').replace(/description/g, 'b.description').replace(/notes/g, 'b.notes')} 
          OR b.make LIKE '%${query || ''}%' 
          OR b.model LIKE '%${query || ''}%'
          OR b.vin LIKE '%${query || ''}%')
        ${tags ? `AND b.id IN (${taggedItemIds.bike.join(',') || 0})` : ''}
        ORDER BY b.make, b.model
      `;
      results.bikes = db.prepare(bikeSql).all();
    }
    
    if (searchTypes.includes('section') && (!tags || taggedItemIds.section.length > 0)) {
      const sectionSql = `
        SELECT s.*, b.make, b.model, b.year, g.name as garage_name
        FROM sections s
        JOIN bikes b ON s.bike_id = b.id
        JOIN garages g ON b.garage_id = g.id
        WHERE (${searchConditions.replace(/name/g, 's.name').replace(/description/g, 's.description').replace(/notes/g, 's.notes')})
        ${tags ? `AND s.id IN (${taggedItemIds.section.join(',') || 0})` : ''}
        ORDER BY s.name
      `;
      results.sections = db.prepare(sectionSql).all();
    }
    
    if (searchTypes.includes('part') && (!tags || taggedItemIds.part.length > 0)) {
      const partSql = `
        SELECT p.*, s.name as section_name, b.make, b.model, b.year, g.name as garage_name
        FROM parts p
        JOIN sections s ON p.section_id = s.id
        JOIN bikes b ON s.bike_id = b.id
        JOIN garages g ON b.garage_id = g.id
        WHERE (${searchConditions.replace(/name/g, 'p.name').replace(/description/g, 'p.description').replace(/notes/g, 'p.notes')}
          OR p.part_number LIKE '%${query || ''}%'
          OR p.supplier_info LIKE '%${query || ''}%')
        ${tags ? `AND p.id IN (${taggedItemIds.part.join(',') || 0})` : ''}
        ORDER BY p.name
      `;
      results.parts = db.prepare(partSql).all();
    }
    
    // Add tag information to each result
    ['garages', 'bikes', 'sections', 'parts'].forEach(entityType => {
      // Map the entity type to the singular form for the tagged_items table
      const itemType = entityType.slice(0, -1);
      
      results[entityType].forEach(item => {
        const tags = db.prepare(`
          SELECT t.* 
          FROM tags t
          JOIN tagged_items ti ON t.id = ti.tag_id
          WHERE ti.item_type = ? AND ti.item_id = ?
        `).all(itemType, item.id);
        
        item.tags = tags;
      });
    });
    
    res.json({
      success: true,
      data: results,
      meta: {
        totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
        query,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        type
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;