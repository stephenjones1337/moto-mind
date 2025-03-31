// Tags management component
function tagsView() {
    return {
      tags: [],
      loading: true,
      newTagName: '',
      newTagColor: '#3498db',
      selectedTagId: null,
      taggedItems: null,
      
      // Initialize the tags view
      init() {
        this.fetchTags();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Update the DOM after data is loaded
        this.$watch('loading', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
        
        // Watch for selected tag changes
        this.$watch('selectedTagId', async () => {
          if (this.selectedTagId) {
            await this.fetchTaggedItems(this.selectedTagId);
          } else {
            this.taggedItems = null;
          }
          this.$el.innerHTML = this.template();
        });
      },
      
      // Fetch all tags
      async fetchTags() {
        try {
          const response = await api.getTags();
          
          if (response.success) {
            this.tags = response.data;
          }
        } catch (error) {
          console.error('Error fetching tags:', error);
          this.$root.addToast('Error loading tags', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Fetch items tagged with a specific tag
      async fetchTaggedItems(tagId) {
        try {
          const response = await api.getTaggedItems(tagId);
          
          if (response.success) {
            this.taggedItems = response.data.items;
          }
        } catch (error) {
          console.error('Error fetching tagged items:', error);
          this.$root.addToast('Error loading tagged items', 'error');
          this.taggedItems = null;
        }
      },
      
      // Select a tag to view its items
      selectTag(tagId) {
        this.selectedTagId = tagId;
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
            this.tags.push(response.data);
            this.newTagName = '';
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error creating tag:', error);
          this.$root.addToast('Error creating tag', 'error');
        }
      },
      
      // Edit a tag
      editTag(tagId) {
        const tag = this.tags.find(t => t.id === tagId);
        if (!tag) return;
        
        const modalContent = `
          <form id="edit-tag-form">
            <div class="form-group">
              <label for="tag-name" class="form-label">Name *</label>
              <input type="text" id="tag-name" value="${tag.name}" required>
            </div>
            
            <div class="form-group">
              <label for="tag-color" class="form-label">Color</label>
              <input type="color" id="tag-color" value="${tag.color}">
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit" id="submit-tag-btn">Update Tag</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Edit Tag', modalContent);
        
        // Add form submission handler
        document.getElementById('edit-tag-form').addEventListener('submit', (event) => {
          event.preventDefault();
          this.updateTag(tagId);
        });
      },
      
      // Update a tag
      async updateTag(tagId) {
        const tag = this.tags.find(t => t.id === tagId);
        if (!tag) return;
        
        const tagData = {
          name: document.getElementById('tag-name').value,
          color: document.getElementById('tag-color').value
        };
        
        try {
          const response = await api.updateTag(tagId, tagData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Tag updated successfully', 'success');
            
            // Update the tag in the list
            const index = this.tags.findIndex(t => t.id === tagId);
            if (index !== -1) {
              this.tags[index] = response.data;
            }
            
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error updating tag:', error);
          this.$root.addToast('Error updating tag', 'error');
        }
      },
      
      // Delete a tag
      async deleteTag(tagId) {
        if (!confirm('Are you sure you want to delete this tag? It will be removed from all items.')) {
          return;
        }
        
        try {
          const response = await api.deleteTag(tagId);
          
          if (response.success) {
            this.$root.addToast('Tag deleted successfully', 'success');
            
            // Remove the tag from the list
            this.tags = this.tags.filter(t => t.id !== tagId);
            
            // Clear selection if the deleted tag was selected
            if (this.selectedTagId === tagId) {
              this.selectedTagId = null;
              this.taggedItems = null;
            }
            
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error deleting tag:', error);
          this.$root.addToast('Error deleting tag', 'error');
        }
      },
      
      // View an item
      viewItem(type, id) {
        switch (type) {
          case 'garage':
            this.$root.viewGarage(id);
            break;
          case 'bike':
            this.$root.viewBike(id);
            break;
          case 'section':
            this.$root.viewSection(id);
            break;
          case 'part':
            this.$root.viewPart(id);
            break;
        }
      },
      
      // Tags view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading tags...</p>
            </div>
          `;
        }
        
        return `
          <div class="page-header">
            <h1 class="page-title">Tag Management</h1>
          </div>
          
          <div class="content-with-sidebar">
            <div class="main-content">
              ${this.selectedTagId ? this.renderTaggedItems() : this.renderTagsList()}
            </div>
            
            <div class="sidebar-panel">
              <div class="panel-section">
                <h3 class="panel-title">Create New Tag</h3>
                <div class="tag-create-form">
                  <input type="text" placeholder="Tag name" x-model="newTagName" @keyup.enter="createTag()">
                  <div class="color-picker">
                    <input type="color" x-model="newTagColor">
                  </div>
                  <button class="btn-primary" @click="createTag()">Create</button>
                </div>
              </div>
              
              <div class="panel-section">
                <h3 class="panel-title">Tag Colors</h3>
                <p class="panel-info">
                  Colors help you visually organize your tags. Choose colors that make sense for your organization system.
                </p>
                <div class="color-examples">
                  <div class="color-example" style="background-color: #3498db20; color: #3498db;">Maintenance</div>
                  <div class="color-example" style="background-color: #e74c3c20; color: #e74c3c;">Needs Attention</div>
                  <div class="color-example" style="background-color: #2ecc7120; color: #2ecc71;">Completed</div>
                  <div class="color-example" style="background-color: #f39c1220; color: #f39c12;">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        `;
      },
      
      // Render tags list view
      renderTagsList() {
        return `
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">All Tags</h2>
            </div>
            <div class="card-body">
              ${this.tags.length === 0 ? `
                <div class="empty-state">
                  <p>No tags created yet. Create your first tag using the form on the right.</p>
                </div>
              ` : `
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Tag</th>
                        <th>Color</th>
                        <th>Items</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.tags.map(tag => `
                        <tr>
                          <td>
                            <div class="tag" style="background-color: ${tag.color}20; color: ${tag.color};">
                              ${tag.name}
                            </div>
                          </td>
                          <td>
                            <div class="color-swatch" style="background-color: ${tag.color}"></div>
                            <code>${tag.color}</code>
                          </td>
                          <td>
                            <button class="btn-link" @click="selectTag(${tag.id})">
                              View Tagged Items
                            </button>
                          </td>
                          <td class="actions-cell">
                            <button class="btn-icon" title="Edit Tag" @click="editTag(${tag.id})">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon danger" title="Delete Tag" @click="deleteTag(${tag.id})">
                              <i class="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </div>
          </div>
        `;
      },
      
      // Render tagged items view
      renderTaggedItems() {
        const tag = this.tags.find(t => t.id === this.selectedTagId);
        if (!tag) return `<div class="error-state">Tag not found</div>`;
        
        if (!this.taggedItems) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading tagged items...</p>
            </div>
          `;
        }
        
        return `
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <button class="btn-back" @click="selectedTagId = null">
                  <i class="fas fa-arrow-left"></i>
                </button>
                Items Tagged with 
                <div class="tag" style="background-color: ${tag.color}20; color: ${tag.color};">
                  ${tag.name}
                </div>
              </h2>
            </div>
            <div class="card-body">
              ${this.hasTaggedItems() ? `
                <div class="tagged-items-container">
                  ${this.renderTaggedItemsCategory('Garages', this.taggedItems.garages, 'garage')}
                  ${this.renderTaggedItemsCategory('Bikes', this.taggedItems.bikes, 'bike')}
                  ${this.renderTaggedItemsCategory('Sections', this.taggedItems.sections, 'section')}
                  ${this.renderTaggedItemsCategory('Parts', this.taggedItems.parts, 'part')}
                </div>
              ` : `
                <div class="empty-state">
                  <p>No items are tagged with "${tag.name}" yet.</p>
                  <p>Apply this tag to bikes, parts, and other items to see them here.</p>
                </div>
              `}
            </div>
          </div>
        `;
      },
      
      // Check if there are any tagged items
      hasTaggedItems() {
        return this.taggedItems && (
          this.taggedItems.garages.length > 0 ||
          this.taggedItems.bikes.length > 0 ||
          this.taggedItems.sections.length > 0 ||
          this.taggedItems.parts.length > 0
        );
      },
      
      // Render a category of tagged items
      renderTaggedItemsCategory(title, items, type) {
        if (!items || items.length === 0) return '';
        
        return `
          <div class="tagged-items-category">
            <h3 class="category-title">${title}</h3>
            <div class="tagged-items-list">
              ${items.map(item => `
                <div class="tagged-item">
                  <div class="tagged-item-name">${this.getItemName(item, type)}</div>
                  <button class="btn-link" @click="viewItem('${type}', ${item.id})">View</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      },
      
      // Get display name for different item types
      getItemName(item, type) {
        switch (type) {
          case 'garage':
            return item.name;
          case 'bike':
            return `${item.make} ${item.model}`;
          case 'section':
            return item.name;
          case 'part':
            return item.name;
          default:
            return 'Unknown item';
        }
      }
    };
  }