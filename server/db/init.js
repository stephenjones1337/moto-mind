// db/init.js
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Initialize database
const db = new sqlite3(path.join(__dirname, '../motoMinder.db'), { verbose: console.log });

// Create tables
const initDb = () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS garages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS bikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      garage_id INTEGER,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      vin TEXT,
      purchase_date TEXT,
      current_mileage INTEGER DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (garage_id) REFERENCES garages (id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bike_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bike_id) REFERENCES bikes (id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      part_number TEXT,
      supplier_info TEXT,
      replacement_url TEXT,
      purchase_date TEXT,
      installation_date TEXT,
      cost REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3498db',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS tagged_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id INTEGER,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bike_id INTEGER,
      part_id INTEGER,
      date TEXT NOT NULL,
      mileage INTEGER,
      description TEXT NOT NULL,
      cost REAL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bike_id) REFERENCES bikes (id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts (id) ON DELETE SET NULL
    )`
  ];

  // Create tables
  tables.forEach(tableQuery => {
    db.prepare(tableQuery).run();
  });
  
  console.log('Database initialized with all tables');
  
  // Create trigger for updating timestamps
  const updateTriggers = [`
    CREATE TRIGGER IF NOT EXISTS update_garages_timestamp 
    AFTER UPDATE ON garages
    BEGIN
      UPDATE garages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, `
    CREATE TRIGGER IF NOT EXISTS update_bikes_timestamp 
    AFTER UPDATE ON bikes
    BEGIN
      UPDATE bikes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, `
    CREATE TRIGGER IF NOT EXISTS update_sections_timestamp 
    AFTER UPDATE ON sections
    BEGIN
      UPDATE sections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, `
    CREATE TRIGGER IF NOT EXISTS update_parts_timestamp 
    AFTER UPDATE ON parts
    BEGIN
      UPDATE parts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `, `
    CREATE TRIGGER IF NOT EXISTS update_tags_timestamp 
    AFTER UPDATE ON tags
    BEGIN
      UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `];
  
  updateTriggers.forEach(trigger => {
    db.prepare(trigger).run();
  });
  
  console.log('Update triggers created');
};

initDb();

module.exports = db;