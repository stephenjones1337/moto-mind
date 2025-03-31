// Parts view component
function partsView(sectionId) {
    return {
      section: null,
      bike: null,
      parts: [],
      allTags: [],
      selectedTags: [],
      loading: true,
      newTagName: '',
      newTagColor: '#3498db',
      
      // Initialize the parts view
      init() {
        this.fetchData();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Update the DOM after data is loaded
        this.$watch('loading', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
        
        // Watch for tag filter changes
        this.$watch('selectedTags', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
      },
      
      // Fetch section and parts data
      async fetchData() {
        try {
          if (!this.sectionId) {
            throw new Error('No section ID provided');
          }
          
          // Fetch section details
          const sectionResponse = await api.getSection(this.sectionId);
          if (sectionResponse.success) {
            this.section = sectionResponse.data;
            
            // Fetch bike details to complete breadcrumbs
            const bikeResponse = await api.getBike(this.section.bike_id);
            if (bikeResponse.success) {
              this.bike = bikeResponse.data;
            }
          }
          
          // Fetch parts for this section
          const partsResponse = await api.getParts(this.sectionId);
          if (partsResponse.success) {
            this.parts = partsResponse.data;
          }
          
          // Fetch all tags for filtering
          const tagsResponse = await api.getTags();
          if (tagsResponse.success) {
            this.allTags = tagsResponse.data;
          }
        } catch (error) {
          console.error('Error fetching parts data:', error);
          this.$root.addToast('Error loading parts data', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Filter parts by selected tags
      getFilteredParts() {
        if (this.selectedTags.length === 0) {
          return this.parts;
        }
        
        return this.parts.filter(part => {
          // Check if part has all selected tags
          return this.selectedTags.every(tagId => {
            return part.tags && part.tags.some(tag => tag.id === tagId);
          });
        });
      },
      
      // Toggle tag selection for filtering
      toggleTagFilter(tagId) {
        if (this.selectedTags.includes(tagId)) {
          this.selectedTags = this.selectedTags.filter(id => id !== tagId);
        } else {
          this.selectedTags.push(tagId);
        }
      },
      
      // Create a new tag
      async createTag() {
        try {
          if (!this.newTagName.trim()) {
            this.$root.addToast('Tag name is required', 'error');
            return;
          }
          
          const response = await api.createTag({
            name: this.newTagName.trim(),
            color: this.newTagColor
          });
          
          if (response.success) {
            this.$root.addToast('Tag created successfully', 'success');
            this.allTags.push(response.data);
            this.newTagName = '';
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error creating tag:', error);
          this.$root.addToast('Error creating tag', 'error');
        }
      },
      
      // View part details
      viewPart(partId) {
        this.$root.viewPart(partId);
      },
      
      // Add a new part
      addPart() {
        const modalContent = `
          <form id="add-part-form">
            <div class="form-group">
              <label for="part-name" class="form-label">Name *</label>
              <input type="text" id="part-name" required>
            </div>
            
            <div class="form-group">
              <label for="part-description" class="form-label">Description</label>
              <textarea id="part-description" rows="2"></textarea>
            </div>
            
            <div class="form-group">
              <label for="part-number" class="form-label">Part Number</label>
              <input type="text" id="part-number">
            </div>
            
            <div class="form-group">
              <label for="part-supplier" class="form-label">Supplier Info</label>
              <input type="text" id="part-supplier">
            </div>
            
            <div class="form-group">
              <label for="part-url" class="form-label">Replacement URL</label>
              <input type="url" id="part-url" placeholder="https://">
            </div>
            
            <div class="form-row">
              <div class="form-group half">
                <label for="part-purchase-date" class="form-label">Purchase Date</label>
                <input type="date" id="part-purchase-date">
              </div>
              
              <div class="form-group half">
                <label for="part-install-date" class="form-label">Installation Date</label>
                <input type="date" id="part-install-date">
              </div>
            </div>
            
            <div class="form-group">
              <label for="part-cost" class="form-label">Cost</label>
              <input type="number" id="part-cost" min="0" step="0.01">
            </div>
            
            <div class="form-group">
              <label for="part-notes" class="form-label">Notes</label>
              <textarea id="part-notes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit" id="submit-part-btn">Add Part</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Add New Part', modalContent);
        
        // Add form submission handler
        document.getElementById('add-part-form').addEventListener('submit', this.submitPartForm.bind(this));
      },
      
      // Handle part form submission
      async submitPartForm(event) {
        event.preventDefault();
        
        const partData = {
          section_id: this.sectionId,
          name: document.getElementById('part-name').value,
          description: document.getElementById('part-description').value || null,
          part_number: document.getElementById('part-number').value || null,
          supplier_info: document.getElementById('part-supplier').value || null,
          replacement_url: document.getElementById('part-url').value || null,
          purchase_date: document.getElementById('part-purchase-date').value || null,
          installation_date: document.getElementById('part-install-date').value || null,
          cost: document.getElementById('part-cost').value || null,
          notes: document.getElementById('part-notes').value || null
        };
        
        try {
          const response = await api.createPart(partData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Part added successfully', 'success');
            
            // Add the new part to the list and refresh the view
            this.parts.push(response.data);
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error adding part:', error);
          this.$root.addToast('Error adding part', 'error');
        }
      },
      
      // Edit a part
      editPart(partId) {
        const part = this.parts.find(p => p.id === partId);
        if (!part) return;
        
        const modalContent = `
          <form id="edit-part-form">
            <div class="form-group">
              <label for="part-name" class="form-label">Name *</label>
              <input type="text" id="part-name" value="${part.name}" required>
            </div>
            
            <div class="form-group">
              <label for="part-description" class="form-label">Description</label>
              <textarea id="part-description" rows="2">${part.description || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="part-number" class="form-label">Part Number</label>
              <input type="text" id="part-number" value="${part.part_number || ''}">
            </div>
            
            <div class="form-group">
              <label for="part-supplier" class="form-label">Supplier Info</label>
              <input type="text" id="part-supplier" value="${part.supplier_info || ''}">
            </div>
            
            <div class="form-group">
              <label for="part-url" class="form-label">Replacement URL</label>
              <input type="url" id="part-url" value="${part.replacement_url || ''}" placeholder="https://">
            </div>
            
            <div class="form-row">
              <div class="form-group half">
                <label for="part-purchase-date" class="form-label">Purchase Date</label>
                <input type="date" id="part-purchase-date" value="${part.purchase_date || ''}">
              </div>
              
              <div class="form-group half">
                <label for="part-install-date" class="form-label">Installation Date</label>
                <input type="date" id="part-install-date" value="${part.installation_date || ''}">
              </div>
            </div>
            
            <div class="form-group">
              <label for="part-cost" class="form-label">Cost</label>
              <input type="number" id="part-cost" min="0" step="0.01" value="${part.cost || ''}">
            </div>
            
            <div class="form-group">
              <label for="part-notes" class="form-label">Notes</label>
              <textarea id="part-notes" rows="3">${part.notes || ''}</textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit" id="submit-part-btn">Update Part</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Edit Part', modalContent);
        
        // Add form submission handler
        document.getElementById('edit-part-form').addEventListener('submit', (event) => {
          event.preventDefault();
          this.updatePart(partId);
        });
      },
      
      // Update a part
      async updatePart(partId) {
        const part = this.parts.find(p => p.id === partId);
        if (!part) return;
        
        const partData = {
          section_id: this.sectionId,
          name: document.getElementById('part-name').value,
          description: document.getElementById('part-description').value || null,
          part_number: document.getElementById('part-number').value || null,
          supplier_info: document.getElementById('part-supplier').value || null,
          replacement_url: document.getElementById('part-url').value || null,
          purchase_date: document.getElementById('part-purchase-date').value || null,
          installation_date: document.getElementById('part-install-date').value || null,
          cost: document.getElementById('part-cost').value || null,
          notes: document.getElementById('part-notes').value || null
        };
        
        try {
          const response = await api.updatePart(partId, partData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Part updated successfully', 'success');
            
            // Update the part in the list
            const index = this.parts.findIndex(p => p.id === partId);
            if (index !== -1) {
              this.parts[index] = response.data;
            }
            
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error updating part:', error);
          this.$root.addToast('Error updating part', 'error');
        }
      },
      
      // Delete a part
      async deletePart(partId) {
        if (!confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
          return;
        }
        
        try {
          const response = await api.deletePart(partId);
          
          if (response.success) {
            this.$root.addToast('Part deleted successfully', 'success');
            
            // Remove the part from the list
            this.parts = this.parts.filter(p => p.id !== partId);
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error deleting part:', error);
          this.$root.addToast('Error deleting part', 'error');
        }
      },
      
      // Manage tags for a part
      async manageTags(partId) {
        const part = this.parts.find(p => p.id === partId);
        if (!part) return;
        
        const partTags = part.tags || [];
        
        const modalContent = `
          <div id="tag-selector">
            <div class="form-group">
              <label class="form-label">Existing Tags</label>
              <div class="tag-list">
                ${this.allTags.length ? this.allTags.map(tag => {
                  const isApplied = partTags.some(t => t.id === tag.id);
                  
                  return `
                    <div class="tag" style="background-color: ${tag.color}20; color: ${tag.color};">
                      ${tag.name}
                      <button type="button" class="tag-toggle-btn" data-tag-id="${tag.id}" data-action="${isApplied ? 'remove' : 'add'}">
                        <i class="fas fa-${isApplied ? 'times' : 'plus'}"></i>
                      </button>
                    </div>
                  `;
                }).join('') : '<p>No tags created yet.</p>'}
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="form-group">
              <label class="form-label">Create New Tag</label>
              <div class="tag-form">
                <input type="text" id="new-tag-name" placeholder="Tag name">
                <input type="color" id="new-tag-color" value="${this.newTagColor}">
                <button type="button" id="create-tag-btn">Create</button>
              </div>
            </div>
          </div>
        `;
        
        this.$root.openModal(`Manage Tags for "${part.name}"`, modalContent);
        
        // Add event listeners to tag toggle buttons
        document.querySelectorAll('.tag-toggle-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const tagId = parseInt(e.currentTarget.dataset.tagId);
            const action = e.currentTarget.dataset.action;
            
            try {
              if (action === 'add') {
                await api.assignTag({
                  tagId: tagId,
                  itemType: 'part',
                  itemId: partId
                });
                
                // Update UI
                e.currentTarget.dataset.action = 'remove';
                e.currentTarget.innerHTML = '<i class="fas fa-times"></i>';
                
                // Add tag to part
                const tag = this.allTags.find(t => t.id === tagId);
                if (!part.tags) part.tags = [];
                part.tags.push(tag);
                
                this.$root.addToast('Tag added to part', 'success');
              } else {
                await api.removeTag({
                  tagId: tagId,
                  itemType: 'part',
                  itemId: partId
                });
                
                // Update UI
                e.currentTarget.dataset.action = 'add';
                e.currentTarget.innerHTML = '<i class="fas fa-plus"></i>';
                
                // Remove tag from part
                if (part.tags) {
                  part.tags = part.tags.filter(t => t.id !== tagId);
                }
                
                this.$root.addToast('Tag removed from part', 'success');
              }
              
              // Refresh view
              this.$el.innerHTML = this.template();
            } catch (error) {
              console.error('Error managing tag:', error);
              this.$root.addToast('Error managing tag', 'error');
            }
          });
        });
        
        // Add create tag button handler
        document.getElementById('create-tag-btn')?.addEventListener('click', async () => {
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
              
              // Add the new tag
              this.allTags.push(response.data);
              
              // Close and reopen modal to refresh the tag list
              this.$root.closeModal();
              this.manageTags(partId);
            }
          } catch (error) {
            console.error('Error creating tag:', error);
            this.$root.addToast('Error creating tag', 'error');
          }
        });
      },
      
      // Parts view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading parts...</p>
            </div>
          `;
        }
        
        if (!this.section || !this.bike) {
          return `
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Section not found or an error occurred.</p>
              <button @click="$root.navigateTo('bikes')" class="btn-primary">
                Back to Bikes
              </button>
            </div>
          `;
        }
        
        return `
          <div class="breadcrumbs">
            <a href="#" @click.prevent="$root.navigateTo('garage', ${this.bike.garage_id})">
              ${this.bike.garage_name || 'Garage'}
            </a>
            <i class="fas fa-chevron-right"></i>
            <a href="#" @click.prevent="$root.viewBike(${this.bike.id})">
              ${this.bike.make} ${this.bike.model}
            </a>
            <i class="fas fa-chevron-right"></i>
            <span>${this.section.name}</span>
          </div>
          
          <div class="page-header">
            <h1 class="page-title">${this.section.name} Parts</h1>
            <button @click="addPart()" class="btn-primary">
              <i class="fas fa-plus"></i> Add Part
            </button>
          </div>
          
          <div class="content-with-sidebar">
            <div class="main-content">
              <div class="card">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Part Number</th>
                        <th>Tags</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.getFilteredParts().length ? this.getFilteredParts().map(part => `
                        <tr>
                          <td>
                            <div class="part-name">${part.name}</div>
                            ${part.description ? `<div class="part-description">${part.description}</div>` : ''}
                          </td>
                          <td>${part.part_number || '-'}</td>
                          <td>
                            <div class="tags-cell">
                              ${part.tags ? part.tags.map(tag => `
                                <div class="tag small" style="background-color: ${tag.color}20; color: ${tag.color};">
                                  ${tag.name}
                                </div>
                              `).join('') : ''}
                              <button class="tag-manage-btn" @click="manageTags(${part.id})">
                                <i class="fas fa-tags"></i>
                              </button>
                            </div>
                          </td>
                          <td class="actions-cell">
                            <button class="btn-icon" title="View Part" @click="viewPart(${part.id})">
                              <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon" title="Edit Part" @click="editPart(${part.id})">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon danger" title="Delete Part" @click="deletePart(${part.id})">
                              <i class="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      `).join('') : `
                        <tr>
                          <td colspan="4" class="empty-table-message">
                            ${this.parts.length === 0 
                              ? 'No parts added yet. Add your first part to get started.' 
                              : 'No parts match the selected tag filters.'}
                          </td>
                        </tr>
                      `}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div class="sidebar-panel">
              <div class="panel-section">
                <h3 class="panel-title">Filter by Tags</h3>
                <div class="tags-container">
                  ${this.allTags.map(tag => `
                    <div class="tag filter-tag ${this.selectedTags.includes(tag.id) ? 'selected' : ''}" 
                         style="background-color: ${this.selectedTags.includes(tag.id) ? tag.color : tag.color + '20'}; 
                                color: ${this.selectedTags.includes(tag.id) ? 'white' : tag.color};"
                         @click="toggleTagFilter(${tag.id})">
                      ${tag.name}
                    </div>
                  `).join('')}
                  
                  ${this.allTags.length === 0 ? `
                    <p class="no-tags-message">No tags created yet</p>
                  ` : ''}
                </div>
              </div>
              
              <div class="panel-section">
                <h3 class="panel-title">Add Tag</h3>
                <div class="tag-create-form">
                  <input type="text" placeholder="New tag name" x-model="newTagName" @keyup.enter="createTag()">
                  <div class="color-picker">
                    <input type="color" x-model="newTagColor">
                  </div>
                  <button class="btn-primary" @click="createTag()">Add</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    };
  }