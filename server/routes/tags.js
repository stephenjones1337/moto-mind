// routes/tags.js
const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Get all tags
router.get('/', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get tag by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    
    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }
    
    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new tag
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag name is required' 
      });
    }
    
    // Check if tag already exists
    const existingTag = db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
    
    if (existingTag) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag name already exists' 
      });
    }
    
    const result = db.prepare(
      'INSERT INTO tags (name, color) VALUES (?, ?)'
    ).run(name, color || '#3498db');
    
    const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: newTag });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update tag
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag name is required' 
      });
    }
    
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    
    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }
    
    // Check if new name conflicts with existing tag
    const existingTag = db.prepare('SELECT * FROM tags WHERE name = ? AND id != ?').get(name, id);
    
    if (existingTag) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag name already exists' 
      });
    }
    
    db.prepare(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?'
    ).run(name, color || tag.color, id);
    
    const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    
    res.json({ success: true, data: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete tag
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    
    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }
    
    // Delete the tag (tagged_items will be deleted via cascade)
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    
    res.json({ 
      success: true, 
      message: 'Tag deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add tag to an item (garage, bike, section, or part)
router.post('/assign', (req, res) => {
  try {
    const { tagId, itemType, itemId, notes } = req.body;
    
    if (!tagId || !itemType || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag ID, item type, and item ID are required' 
      });
    }
    
    // Validate item type
    const validItemTypes = ['garage', 'bike', 'section', 'part'];
    if (!validItemTypes.includes(itemType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid item type. Must be one of: garage, bike, section, part' 
      });
    }
    
    // Check if tag exists
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);
    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }
    
    // Check if item exists
    let itemExists = false;
    switch (itemType) {
      case 'garage':
        itemExists = !!db.prepare('SELECT 1 FROM garages WHERE id = ?').get(itemId);
        break;
      case 'bike':
        itemExists = !!db.prepare('SELECT 1 FROM bikes WHERE id = ?').get(itemId);
        break;
      case 'section':
        itemExists = !!db.prepare('SELECT 1 FROM sections WHERE id = ?').get(itemId);
        break;
      case 'part':
        itemExists = !!db.prepare('SELECT 1 FROM parts WHERE id = ?').get(itemId);
        break;
    }
    
    if (!itemExists) {
      return res.status(404).json({ 
        success: false, 
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found` 
      });
    }
    
    // Check if tag is already assigned to this item
    const existingTagging = db.prepare(
      'SELECT * FROM tagged_items WHERE tag_id = ? AND item_type = ? AND item_id = ?'
    ).get(tagId, itemType, itemId);
    
    if (existingTagging) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag is already assigned to this item' 
      });
    }
    
    // Assign tag to item
    const result = db.prepare(
      'INSERT INTO tagged_items (tag_id, item_type, item_id, notes) VALUES (?, ?, ?, ?)'
    ).run(tagId, itemType, itemId, notes || null);
    
    res.status(201).json({ 
      success: true,
      message: 'Tag assigned successfully',
      data: {
        id: result.lastInsertRowid,
        tagId,
        itemType,
        itemId,
        notes
      }
    });
  } catch (error) {
    console.error('Error assigning tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove tag from an item
router.delete('/remove', (req, res) => {
  try {
    const { tagId, itemType, itemId } = req.body;
    
    if (!tagId || !itemType || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag ID, item type, and item ID are required' 
      });
    }
    
    const result = db.prepare(
      'DELETE FROM tagged_items WHERE tag_id = ? AND item_type = ? AND item_id = ?'
    ).run(tagId, itemType, itemId);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag assignment not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Tag removed successfully' 
    });
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all items with a specific tag
router.get('/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tag not found' 
      });
    }
    
    // Get all tagged items
    const taggedItems = db.prepare(`
      SELECT ti.item_type, ti.item_id 
      FROM tagged_items ti
      WHERE ti.tag_id = ?
    `).all(id);
    
    // Group items by type
    const items = {
      garages: [],
      bikes: [],
      sections: [],
      parts: []
    };
    
    // Fetch actual items
    for (const item of taggedItems) {
      switch (item.item_type) {
        case 'garage':
          const garage = db.prepare('SELECT * FROM garages WHERE id = ?').get(item.item_id);
          if (garage) items.garages.push(garage);
          break;
        case 'bike':
          const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(item.item_id);
          if (bike) items.bikes.push(bike);
          break;
        case 'section':
          const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(item.item_id);
          if (section) items.sections.push(section);
          break;
        case 'part':
          const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(item.item_id);
          if (part) items.parts.push(part);
          break;
      }
    }
    
    res.json({ 
      success: true, 
      data: { tag, items } 
    });
  } catch (error) {
    console.error('Error fetching tagged items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;