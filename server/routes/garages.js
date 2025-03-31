// routes/garages.js
const express = require('express');
const router = express.Router();
const db = require('../db/init');

// Get all garages
router.get('/', (req, res) => {
  try {
    const garages = db.prepare('SELECT * FROM garages ORDER BY name').all();
    res.json({ success: true, data: garages });
  } catch (error) {
    console.error('Error fetching garages:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get garage by ID with its bikes
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get garage
    const garage = db.prepare('SELECT * FROM garages WHERE id = ?').get(id);
    
    if (!garage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Garage not found' 
      });
    }
    
    // Get bikes for this garage
    const bikes = db.prepare('SELECT * FROM bikes WHERE garage_id = ?').all(id);
    
    // Get tags for this garage
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN tagged_items ti ON t.id = ti.tag_id
      WHERE ti.item_type = 'garage' AND ti.item_id = ?
    `).all(id);
    
    res.json({ 
      success: true, 
      data: { ...garage, bikes, tags } 
    });
  } catch (error) {
    console.error('Error fetching garage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new garage
router.post('/', (req, res) => {
  try {
    const { name, location, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Garage name is required' 
      });
    }
    
    const result = db.prepare(
      'INSERT INTO garages (name, location, notes) VALUES (?, ?, ?)'
    ).run(name, location || null, notes || null);
    
    const newGarage = db.prepare('SELECT * FROM garages WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: newGarage });
  } catch (error) {
    console.error('Error creating garage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update garage
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Garage name is required' 
      });
    }
    
    const garage = db.prepare('SELECT * FROM garages WHERE id = ?').get(id);
    
    if (!garage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Garage not found' 
      });
    }
    
    db.prepare(
      'UPDATE garages SET name = ?, location = ?, notes = ? WHERE id = ?'
    ).run(name, location || null, notes || null, id);
    
    const updatedGarage = db.prepare('SELECT * FROM garages WHERE id = ?').get(id);
    
    res.json({ success: true, data: updatedGarage });
  } catch (error) {
    console.error('Error updating garage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete garage
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const garage = db.prepare('SELECT * FROM garages WHERE id = ?').get(id);
    
    if (!garage) {
      return res.status(404).json({ 
        success: false, 
        message: 'Garage not found' 
      });
    }
    
    // SQLite cascading deletes will take care of associated bikes, sections, parts
    db.prepare('DELETE FROM garages WHERE id = ?').run(id);
    
    // Also delete any tags associated with this garage
    db.prepare('DELETE FROM tagged_items WHERE item_type = ? AND item_id = ?').run('garage', id);
    
    res.json({ 
      success: true, 
      message: 'Garage deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting garage:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;