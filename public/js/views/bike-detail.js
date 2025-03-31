// Bike detail view component
function bikeDetailView(bikeId) {
    return {
      bike: null,
      sections: [],
      maintenance: [],
      tags: [],
      loading: true,
      activeTab: 'overview',
      
      // Initialize the bike detail view
      init() {
        this.fetchBikeData();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Update the DOM after data is loaded
        this.$watch('loading', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
        
        // Watch for tab changes
        this.$watch('activeTab', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
      },
      
      // Fetch bike data from API
      async fetchBikeData() {
        try {
          if (!this.bikeId) {
            throw new Error('No bike ID provided');
          }
          
          // Fetch bike details
          const bikeResponse = await api.getBike(this.bikeId);
          if (bikeResponse.success) {
            this.bike = bikeResponse.data;
            this.tags = this.bike.tags || [];
          }
          
          // Fetch bike sections
          const sectionsResponse = await api.getSections(this.bikeId);
          if (sectionsResponse.success) {
            this.sections = sectionsResponse.data;
          }
          
          // Fetch maintenance records
          const maintenanceResponse = await api.getMaintenance(this.bikeId);
          if (maintenanceResponse.success) {
            this.maintenance = maintenanceResponse.data.sort((a, b) => {
              return new Date(b.date) - new Date(a.date); // Sort by date descending
            });
          }
        } catch (error) {
          console.error('Error fetching bike data:', error);
          this.$root.addToast('Error loading bike data', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Format date to display
      formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      
      // Calculate maintenance score (percentage of completed maintenance items)
      calculateMaintenanceScore() {
        if (!this.maintenance || this.maintenance.length === 0) {
          return 100; // No maintenance items means perfect score
        }
        
        const totalItems = this.maintenance.length;
        const completedItems = this.maintenance.filter(item => item.status === 'completed').length;
        
        return Math.round((completedItems / totalItems) * 100);
      },
      
      // Get recent maintenance
      getRecentMaintenance() {
        return this.maintenance.slice(0, 1)[0] || null;
      },
      
      // Get upcoming maintenance
      getUpcomingMaintenance() {
        const now = new Date();
        
        // Filter upcoming maintenance and sort by due date
        const upcoming = this.maintenance
          .filter(item => {
            return item.status !== 'completed' && new Date(item.due_date) > now;
          })
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        
        return upcoming[0] || null;
      },
      
      // Calculate days until maintenance is due
      daysUntilDue(dueDate) {
        if (!dueDate) return 'N/A';
        
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = Math.abs(due - now);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      
      // Change active tab
      setActiveTab(tab) {
        this.activeTab = tab;
      },
      
      // View a section's details
      viewSection(sectionId) {
        this.$root.viewSection(sectionId);
      },
      
      // Edit bike details
      editBike() {
        const bike = this.bike;
        
        const modalContent = `
          <form id="edit-bike-form" @submit.prevent="submitEditBikeForm">
            <div class="form-group">
              <label for="bike-make" class="form-label">Make *</label>
              <input type="text" id="bike-make" value="${bike.make}" required>
            </div>
            
            <div class="form-group">
              <label for="bike-model" class="form-label">Model *</label>
              <input type="text" id="bike-model" value="${bike.model}" required>
            </div>
            
            <div class="form-group">
              <label for="bike-year" class="form-label">Year</label>
              <input type="number" id="bike-year" value="${bike.year || ''}" min="1885" max="${new Date().getFullYear() + 1}">
            </div>
            
            <div class="form-group">
              <label for="bike-vin" class="form-label">VIN</label>
              <input type="text" id="bike-vin" value="${bike.vin || ''}">
            </div>
            
            <div class="form-group">
              <label for="bike-purchase-date" class="form-label">Purchase Date</label>
              <input type="date" id="bike-purchase-date" value="${bike.purchase_date || ''}">
            </div>
            
            <div class="form-group">
              <label for="bike-mileage" class="form-label">Current Mileage</label>
              <input type="number" id="bike-mileage" value="${bike.current_mileage || 0}" min="0">
            </div>
            
            <div class="form-group">
              <label for="bike-notes" class="form-label">Notes</label>
              <textarea id="bike-notes" rows="3">${bike.notes || ''}</textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit">Save Changes</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Edit Bike', modalContent);
        
        // Add form submission handler after the modal is opened
        document.getElementById('edit-bike-form').addEventListener('submit', this.submitEditBikeForm.bind(this));
      },
      
      // Handle edit bike form submission
      async submitEditBikeForm(event) {
        event.preventDefault();
        
        const bikeData = {
          make: document.getElementById('bike-make').value,
          model: document.getElementById('bike-model').value,
          year: document.getElementById('bike-year').value || null,
          vin: document.getElementById('bike-vin').value || null,
          purchase_date: document.getElementById('bike-purchase-date').value || null,
          current_mileage: document.getElementById('bike-mileage').value || 0,
          notes: document.getElementById('bike-notes').value || null,
          garage_id: this.bike.garage_id // Maintain the same garage
        };
        
        try {
          const response = await api.updateBike(this.bikeId, bikeData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Bike updated successfully', 'success');
            
            // Update the bike data and refresh the view
            this.bike = response.data;
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error updating bike:', error);
          this.$root.addToast('Error updating bike', 'error');
        }
      },
      
      // Add a new section
      addSection() {
        const modalContent = `
          <form id="add-section-form" @submit.prevent="submitSectionForm">
            <div class="form-group">
              <label for="section-name" class="form-label">Name *</label>
              <input type="text" id="section-name" required>
            </div>
            
            <div class="form-group">
              <label for="section-description" class="form-label">Description</label>
              <textarea id="section-description" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label for="section-notes" class="form-label">Notes</label>
              <textarea id="section-notes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit">Add Section</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Add New Section', modalContent);
        
        // Add form submission handler after the modal is opened
        document.getElementById('add-section-form').addEventListener('submit', this.submitSectionForm.bind(this));
      },
      
      // Handle section form submission
      async submitSectionForm(event) {
        event.preventDefault();
        
        const sectionData = {
          bike_id: this.bikeId,
          name: document.getElementById('section-name').value,
          description: document.getElementById('section-description').value || null,
          notes: document.getElementById('section-notes').value || null
        };
        
        try {
          const response = await api.createSection(sectionData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Section added successfully', 'success');
            
            // Add the new section to the list and refresh the view
            this.sections.push(response.data);
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error adding section:', error);
          this.$root.addToast('Error adding section', 'error');
        }
      },
      
      // Add maintenance record
      addMaintenance() {
        const today = new Date().toISOString().split('T')[0];
        
        const modalContent = `
          <form id="add-maintenance-form" @submit.prevent="submitMaintenanceForm">
            <div class="form-group">
              <label for="maintenance-description" class="form-label">Description *</label>
              <input type="text" id="maintenance-description" required>
            </div>
            
            <div class="form-group">
              <label for="maintenance-date" class="form-label">Date *</label>
              <input type="date" id="maintenance-date" value="${today}" required>
            </div>
            
            <div class="form-group">
              <label for="maintenance-mileage" class="form-label">Mileage</label>
              <input type="number" id="maintenance-mileage" value="${this.bike.current_mileage || 0}" min="0">
            </div>
            
            <div class="form-group">
              <label for="maintenance-cost" class="form-label">Cost</label>
              <input type="number" id="maintenance-cost" min="0" step="0.01">
            </div>
            
            <div class="form-group">
              <label for="maintenance-notes" class="form-label">Notes</label>
              <textarea id="maintenance-notes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit">Log Maintenance</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Log Maintenance', modalContent);
        
        // Add form submission handler after the modal is opened
        document.getElementById('add-maintenance-form').addEventListener('submit', this.submitMaintenanceForm.bind(this));
      },
      
      // Handle maintenance form submission
      async submitMaintenanceForm(event) {
        event.preventDefault();
        
        const maintenanceData = {
          bike_id: this.bikeId,
          description: document.getElementById('maintenance-description').value,
          date: document.getElementById('maintenance-date').value,
          mileage: document.getElementById('maintenance-mileage').value || this.bike.current_mileage || 0,
          cost: document.getElementById('maintenance-cost').value || null,
          notes: document.getElementById('maintenance-notes').value || null,
          status: 'completed'
        };
        
        try {
          const response = await api.createMaintenance(maintenanceData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Maintenance logged successfully', 'success');
            
            // Add the new maintenance record and refresh the view
            this.maintenance.unshift(response.data); // Add to beginning
            this.$el.innerHTML = this.template();
            
            // Update bike mileage if maintenance mileage is higher
            if (maintenanceData.mileage > this.bike.current_mileage) {
              await api.updateBike(this.bikeId, {
                ...this.bike,
                current_mileage: maintenanceData.mileage
              });
              
              this.bike.current_mileage = maintenanceData.mileage;
            }
          }
        } catch (error) {
          console.error('Error logging maintenance:', error);
          this.$root.addToast('Error logging maintenance', 'error');
        }
      },
      
      // Tag management
      async addTag() {
        const modalContent = `
          <div id="tag-selector">
            <div class="form-group">
              <label class="form-label">Existing Tags</label>
              <div class="tag-list" id="existing-tags">
                <p>Loading tags...</p>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="form-group">
              <label for="new-tag-name" class="form-label">Create New Tag</label>
              <div class="tag-form">
                <input type="text" id="new-tag-name" placeholder="Tag name">
                <input type="color" id="new-tag-color" value="#3498db">
                <button type="button" id="create-tag-btn">Create</button>
              </div>
            </div>
          </div>
        `;
        
        this.$root.openModal('Manage Tags', modalContent);
        
        // Load existing tags
        try {
          const tagsResponse = await api.getTags();
          
          if (tagsResponse.success) {
            const allTags = tagsResponse.data;
            const tagContainer = document.getElementById('existing-tags');
            
            if (allTags.length === 0) {
              tagContainer.innerHTML = '<p>No tags created yet. Create your first tag below.</p>';
              return;
            }
            
            // Create tag elements
            tagContainer.innerHTML = allTags.map(tag => {
              const isApplied = this.tags.some(t => t.id === tag.id);
              
              return `
                <div class="tag" style="background-color: ${tag.color}20; color: ${tag.color};">
                  ${tag.name}
                  <button type="button" class="tag-toggle-btn" data-tag-id="${tag.id}" data-action="${isApplied ? 'remove' : 'add'}">
                    <i class="fas fa-${isApplied ? 'times' : 'plus'}"></i>
                  </button>
                </div>
              `;
            }).join('');
            
            // Add event listeners to tag toggle buttons
            document.querySelectorAll('.tag-toggle-btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const tagId = parseInt(e.currentTarget.dataset.tagId);
                const action = e.currentTarget.dataset.action;
                
                try {
                  if (action === 'add') {
                    await api.assignTag({
                      tagId: tagId,
                      itemType: 'bike',
                      itemId: this.bikeId
                    });
                    
                    const tag = allTags.find(t => t.id === tagId);
                    this.tags.push(tag);
                    e.currentTarget.dataset.action = 'remove';
                    e.currentTarget.innerHTML = '<i class="fas fa-times"></i>';
                    
                    this.$root.addToast('Tag added', 'success');
                  } else {
                    await api.removeTag({
                      tagId: tagId,
                      itemType: 'bike',
                      itemId: this.bikeId
                    });
                    
                    this.tags = this.tags.filter(t => t.id !== tagId);
                    e.currentTarget.dataset.action = 'add';
                    e.currentTarget.innerHTML = '<i class="fas fa-plus"></i>';
                    
                    this.$root.addToast('Tag removed', 'success');
                  }
                  
                  // Update the view
                  this.$el.innerHTML = this.template();
                } catch (error) {
                  console.error('Error managing tag:', error);
                  this.$root.addToast('Error managing tag', 'error');
                }
              });
            });
            
            // Add create tag button handler
            document.getElementById('create-tag-btn').addEventListener('click', async () => {
              const name = document.getElementById('new-tag-name').value.trim();
              const color = document.getElementById('new-tag-color').value;
              
              if (!name) {
                this.$root.addToast('Tag name is required', 'error');
                return;
              }
              
              try {
                const response = await api.createTag({ name, color });
                
                if (response.success) {
                  this.$root.addToast('Tag created successfully', 'success');
                  
                  // Add the new tag to the bike
                  await api.assignTag({
                    tagId: response.data.id,
                    itemType: 'bike',
                    itemId: this.bikeId
                  });
                  
                  this.tags.push(response.data);
                  
                  // Update the view and close the modal
                  this.$el.innerHTML = this.template();
                  this.$root.closeModal();
                }
              } catch (error) {
                console.error('Error creating tag:', error);
                this.$root.addToast('Error creating tag', 'error');
              }
            });
          }
        } catch (error) {
          console.error('Error loading tags:', error);
          document.getElementById('existing-tags').innerHTML = '<p>Error loading tags. Please try again.</p>';
        }
      },
      
      // Bike detail view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading bike details...</p>
            </div>
          `;
        }
        
        if (!this.bike) {
          return `
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Bike not found or an error occurred.</p>
              <button @click="$root.navigateTo('bikes')" class="btn-primary">
                Back to Bikes
              </button>
            </div>
          `;
        }
        
        return `
          <div class="bike-header">
            <div class="bike-header-content">
              <h1 class="bike-title">${this.bike.make} ${this.bike.model}</h1>
              <p class="bike-subtitle">
                ${this.bike.year ? `${this.bike.year} • ` : ''}
                ${this.bike.current_mileage ? `${this.bike.current_mileage.toLocaleString()} miles • ` : ''}
                Garage: ${this.bike.garage_name || 'Unknown'}
              </p>
              
              <div class="tags-container">
                ${this.tags.map(tag => `
                  <div class="tag" style="background-color: ${tag.color}20; color: ${tag.color};">
                    ${tag.name}
                  </div>
                `).join('')}
                
                <button class="tag add-tag" @click="addTag()">
                  <i class="fas fa-plus"></i> Add Tag
                </button>
              </div>
            </div>
            
            <div class="bike-header-actions">
              <button class="btn-secondary" @click="editBike()">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn-primary" @click="addMaintenance()">
                <i class="fas fa-tools"></i> Maintain
              </button>
            </div>
          </div>
          
          <div class="tabs">
            <button class="tab-item ${this.activeTab === 'overview' ? 'active' : ''}" 
                    @click="setActiveTab('overview')">Overview</button>
            <button class="tab-item ${this.activeTab === 'sections' ? 'active' : ''}" 
                    @click="setActiveTab('sections')">Sections</button>
            <button class="tab-item ${this.activeTab === 'maintenance' ? 'active' : ''}" 
                    @click="setActiveTab('maintenance')">Maintenance</button>
            <button class="tab-item ${this.activeTab === 'notes' ? 'active' : ''}" 
                    @click="setActiveTab('notes')">Notes</button>
          </div>
          
          <div class="tab-content">
            <!-- Overview Tab -->
            ${this.activeTab === 'overview' ? `
              <div class="two-column-grid">
                <div class="card">
                  <div class="card-header">
                    <h2 class="card-title">Details</h2>
                  </div>
                  <div class="card-body">
                    <div class="detail-group">
                      <div class="detail-label">Make:</div>
                      <div class="detail-value">${this.bike.make}</div>
                    </div>
                    
                    <div class="detail-group">
                      <div class="detail-label">Model:</div>
                      <div class="detail-value">${this.bike.model}</div>
                    </div>
                    
                    <div class="detail-group">
                      <div class="detail-label">Year:</div>
                      <div class="detail-value">${this.bike.year || 'N/A'}</div>
                    </div>
                    
                    <div class="detail-group">
                      <div class="detail-label">VIN:</div>
                      <div class="detail-value">${this.bike.vin || 'N/A'}</div>
                    </div>
                    
                    <div class="detail-group">
                      <div class="detail-label">Purchase Date:</div>
                      <div class="detail-value">${this.formatDate(this.bike.purchase_date)}</div>
                    </div>
                    
                    <div class="detail-group">
                      <div class="detail-label">Current Mileage:</div>
                      <div class="detail-value">${this.bike.current_mileage ? `${this.bike.current_mileage.toLocaleString()} mi` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
                
                <div class="card">
                  <div class="card-header">
                    <h2 class="card-title">Maintenance Summary</h2>
                  </div>
                  <div class="card-body">
                    <div class="maintenance-chart">
                      <div class="maintenance-score">
                        <div class="score-circle" style="--percentage: ${this.calculateMaintenanceScore()}%;">
                          <div class="score-circle-inner">
                            <span class="score-value">${this.calculateMaintenanceScore()}%</span>
                            <span class="score-label">Maintenance Score</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="maintenance-summary">
                        <div class="detail-group">
                          <div class="detail-label">Last Service:</div>
                          <div class="detail-value">
                            ${this.getRecentMaintenance() 
                              ? `${this.getRecentMaintenance().description} (${this.formatDate(this.getRecentMaintenance().date)})` 
                              : 'No records'}
                          </div>
                        </div>
                        
                        <div class="detail-group">
                          <div class="detail-label">Next Service:</div>
                          <div class="detail-value ${this.getUpcomingMaintenance() && this.daysUntilDue(this.getUpcomingMaintenance().due_date) <= 7 ? 'text-danger' : ''}">
                            ${this.getUpcomingMaintenance() 
                              ? `${this.getUpcomingMaintenance().description} (${this.daysUntilDue(this.getUpcomingMaintenance().due_date)} days)` 
                              : 'No upcoming maintenance'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 class="section-title">Key Sections</h2>
              <div class="sections-grid">
                ${this.sections.length ? this.sections.slice(0, 3).map(section => `
                  <div class="section-card">
                    <h3 class="section-name">${section.name}</h3>
                    <p class="section-description">${section.description || 'No description'}</p>
                    <p class="section-parts">Parts: ${section.parts_count || 0}</p>
                    <a href="#" @click.prevent="viewSection(${section.id})" class="section-link">View</a>
                  </div>
                `).join('') : `
                  <div class="empty-state">
                    <p>No sections added yet. Add your first section to organize your bike parts.</p>
                  </div>
                `}
                
                <div class="add-section-card" @click="addSection()">
                  <div class="add-icon">
                    <i class="fas fa-plus"></i>
                  </div>
                  <span>Add Section</span>
                </div>
              </div>
            ` : ''}
            
            <!-- Sections Tab -->
            ${this.activeTab === 'sections' ? `
              <div class="tab-header">
                <h2 class="section-title">Bike Sections</h2>
                <button class="btn-primary" @click="addSection()">
                  <i class="fas fa-plus"></i> Add Section
                </button>
              </div>
              
              <div class="sections-grid">
                ${this.sections.length ? this.sections.map(section => `
                  <div class="section-card">
                    <h3 class="section-name">${section.name}</h3>
                    <p class="section-description">${section.description || 'No description'}</p>
                    <p class="section-parts">Parts: ${section.parts_count || 0}</p>
                    <div class="section-actions">
                      <a href="#" @click.prevent="viewSection(${section.id})" class="section-link">View</a>
                    </div>
                  </div>
                `).join('') : `
                  <div class="empty-state wide">
                    <p>No sections added yet. Sections help you organize parts of your motorcycle like Engine, Suspension, Brakes, etc.</p>
                    <button class="btn-primary" @click="addSection()">
                      <i class="fas fa-plus"></i> Add Your First Section
                    </button>
                  </div>
                `}
              </div>
            ` : ''}
            
            <!-- Maintenance Tab -->
            ${this.activeTab === 'maintenance' ? `
              <div class="tab-header">
                <h2 class="section-title">Maintenance History</h2>
                <button class="btn-primary" @click="addMaintenance()">
                  <i class="fas fa-plus"></i> Log Maintenance
                </button>
              </div>
              
              ${this.maintenance.length ? `
                <div class="maintenance-timeline">
                  ${this.maintenance.map(item => `
                    <div class="maintenance-card">
                      <div class="maintenance-icon">
                        <i class="fas fa-wrench"></i>
                      </div>
                      <div class="maintenance-content">
                        <div class="maintenance-title">${item.description}</div>
                        <div class="maintenance-date">${this.formatDate(item.date)}</div>
                        <div class="maintenance-meta">
                          ${item.mileage ? `Mileage: ${item.mileage.toLocaleString()} mi` : ''}
                          ${item.cost ? `• Cost: ${parseFloat(item.cost).toFixed(2)}` : ''}
                        </div>
                        ${item.notes ? `<div class="maintenance-notes">${item.notes}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="empty-state">
                  <p>No maintenance records yet. Keep track of all services performed on your bike.</p>
                  <button class="btn-primary" @click="addMaintenance()">
                    <i class="fas fa-plus"></i> Log Your First Maintenance
                  </button>
                </div>
              `}
            ` : ''}
            
            <!-- Notes Tab -->
            ${this.activeTab === 'notes' ? `
              <div class="tab-header">
                <h2 class="section-title">Bike Notes</h2>
                <button class="btn-secondary" @click="editBike()">
                  <i class="fas fa-edit"></i> Edit Notes
                </button>
              </div>
              
              <div class="card">
                <div class="card-body">
                  ${this.bike.notes ? `
                    <div class="notes-content">
                      ${this.bike.notes.replace(/\n/g, '<br>')}
                    </div>
                  ` : `
                    <div class="empty-state">
                      <p>No notes added yet. Add notes to keep track of important information about your bike.</p>
                      <button class="btn-secondary" @click="editBike()">
                        <i class="fas fa-edit"></i> Add Notes
                      </button>
                    </div>
                  `}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
    };
  }