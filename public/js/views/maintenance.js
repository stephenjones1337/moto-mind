// Maintenance view component
function maintenanceView() {
    return {
      maintenance: [],
      bikes: [],
      loading: true,
      activeTab: 'recent',
      selectedBikeId: 'all',
      
      // Initialize the maintenance view
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
        
        // Watch for tab changes
        this.$watch('activeTab', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
        
        // Watch for bike filter changes
        this.$watch('selectedBikeId', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
      },
      
      // Fetch maintenance and bikes data
      async fetchData() {
        try {
          // Fetch all bikes for filtering
          const bikesResponse = await api.getBikes();
          if (bikesResponse.success) {
            this.bikes = bikesResponse.data;
          }
          
          // Fetch all maintenance records
          const maintenanceResponse = await api.getMaintenance();
          if (maintenanceResponse.success) {
            this.maintenance = maintenanceResponse.data;
          }
        } catch (error) {
          console.error('Error fetching maintenance data:', error);
          this.$root.addToast('Error loading maintenance data', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Format date for display
      formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      
      // Get filtered maintenance records based on active tab and bike filter
      getFilteredMaintenance() {
        // First filter by bike if selected
        let filtered = this.maintenance;
        
        if (this.selectedBikeId !== 'all') {
          const bikeId = parseInt(this.selectedBikeId);
          filtered = filtered.filter(item => item.bike_id === bikeId);
        }
        
        // Then filter by tab
        const now = new Date();
        
        switch (this.activeTab) {
          case 'recent':
            // Show most recent completed maintenance
            return filtered
              .filter(item => item.status === 'completed')
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10);
            
          case 'upcoming':
            // Show scheduled maintenance that's not completed
            return filtered
              .filter(item => {
                return item.status !== 'completed' && 
                       item.due_date && 
                       new Date(item.due_date) > now;
              })
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
            
          case 'history':
            // Show all maintenance sorted by date
            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            
          default:
            return filtered;
        }
      },
      
      // Change active tab
      setActiveTab(tab) {
        this.activeTab = tab;
      },
      
      // Get bike name by ID
      getBikeName(bikeId) {
        const bike = this.bikes.find(b => b.id === bikeId);
        return bike ? `${bike.make} ${bike.model}` : 'Unknown Bike';
      },
      
      // Calculate days until maintenance is due
      daysUntilDue(dueDate) {
        if (!dueDate) return 'N/A';
        
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = Math.abs(due - now);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      
      // View a specific bike
      viewBike(bikeId) {
        this.$root.viewBike(bikeId);
      },
      
      // Add new maintenance record
      addMaintenance() {
        const today = new Date().toISOString().split('T')[0];
        
        const modalContent = `
          <form id="add-maintenance-form">
            <div class="form-group">
              <label for="maintenance-bike" class="form-label">Bike *</label>
              <select id="maintenance-bike" required>
                ${this.bikes.map(bike => `
                  <option value="${bike.id}">${bike.make} ${bike.model}</option>
                `).join('')}
              </select>
            </div>
            
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
              <input type="number" id="maintenance-mileage" min="0">
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
              <button type="submit" id="submit-maintenance-btn">Log Maintenance</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Log Maintenance', modalContent);
        
        // Add form submission handler
        document.getElementById('add-maintenance-form').addEventListener('submit', this.submitMaintenanceForm.bind(this));
      },
      
      // Submit maintenance form
      async submitMaintenanceForm(event) {
        event.preventDefault();
        
        const bikeId = parseInt(document.getElementById('maintenance-bike').value);
        const bike = this.bikes.find(b => b.id === bikeId);
        
        const maintenanceData = {
          bike_id: bikeId,
          description: document.getElementById('maintenance-description').value,
          date: document.getElementById('maintenance-date').value,
          mileage: document.getElementById('maintenance-mileage').value || (bike ? bike.current_mileage : 0),
          cost: document.getElementById('maintenance-cost').value || null,
          notes: document.getElementById('maintenance-notes').value || null,
          status: 'completed'
        };
        
        try {
          const response = await api.createMaintenance(maintenanceData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Maintenance logged successfully', 'success');
            
            // Add the new maintenance record
            this.maintenance.unshift(response.data);
            this.$el.innerHTML = this.template();
            
            // Update bike mileage if maintenance mileage is higher
            if (bike && maintenanceData.mileage > bike.current_mileage) {
              await api.updateBike(bikeId, {
                ...bike,
                current_mileage: maintenanceData.mileage
              });
            }
          }
        } catch (error) {
          console.error('Error logging maintenance:', error);
          this.$root.addToast('Error logging maintenance', 'error');
        }
      },
      
      // Schedule maintenance
      scheduleMaintenance() {
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);
        
        const defaultDueDate = thirtyDaysLater.toISOString().split('T')[0];
        
        const modalContent = `
          <form id="schedule-maintenance-form">
            <div class="form-group">
              <label for="maintenance-bike" class="form-label">Bike *</label>
              <select id="maintenance-bike" required>
                ${this.bikes.map(bike => `
                  <option value="${bike.id}">${bike.make} ${bike.model}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="maintenance-description" class="form-label">Description *</label>
              <input type="text" id="maintenance-description" required>
            </div>
            
            <div class="form-group">
              <label for="maintenance-due-date" class="form-label">Due Date *</label>
              <input type="date" id="maintenance-due-date" value="${defaultDueDate}" required>
            </div>
            
            <div class="form-group">
              <label for="maintenance-notes" class="form-label">Notes</label>
              <textarea id="maintenance-notes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit" id="submit-schedule-btn">Schedule</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Schedule Maintenance', modalContent);
        
        // Add form submission handler
        document.getElementById('schedule-maintenance-form').addEventListener('submit', this.submitScheduleForm.bind(this));
      },
      
      // Submit schedule form
      async submitScheduleForm(event) {
        event.preventDefault();
        
        const maintenanceData = {
          bike_id: parseInt(document.getElementById('maintenance-bike').value),
          description: document.getElementById('maintenance-description').value,
          due_date: document.getElementById('maintenance-due-date').value,
          notes: document.getElementById('maintenance-notes').value || null,
          status: 'scheduled'
        };
        
        try {
          const response = await api.createMaintenance(maintenanceData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Maintenance scheduled successfully', 'success');
            
            // Add the new scheduled maintenance
            this.maintenance.push(response.data);
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error scheduling maintenance:', error);
          this.$root.addToast('Error scheduling maintenance', 'error');
        }
      },
      
      // Mark maintenance as complete
      async markComplete(id) {
        const item = this.maintenance.find(m => m.id === id);
        if (!item) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        try {
          const response = await api.updateMaintenance(id, {
            ...item,
            status: 'completed',
            date: today
          });
          
          if (response.success) {
            this.$root.addToast('Maintenance marked as complete', 'success');
            
            // Update the item in the list
            const index = this.maintenance.findIndex(m => m.id === id);
            if (index !== -1) {
              this.maintenance[index] = response.data;
            }
            
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error marking maintenance as complete:', error);
          this.$root.addToast('Error updating maintenance', 'error');
        }
      },
      
      // Delete maintenance
      async deleteMaintenance(id) {
        if (!confirm('Are you sure you want to delete this maintenance record? This action cannot be undone.')) {
          return;
        }
        
        try {
          const response = await api.deleteMaintenance(id);
          
          if (response.success) {
            this.$root.addToast('Maintenance record deleted', 'success');
            
            // Remove from the list
            this.maintenance = this.maintenance.filter(m => m.id !== id);
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error deleting maintenance:', error);
          this.$root.addToast('Error deleting maintenance', 'error');
        }
      },
      
      // Maintenance view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading maintenance data...</p>
            </div>
          `;
        }
        
        return `
          <div class="page-header">
            <h1 class="page-title">Maintenance Tracking</h1>
            <div class="action-buttons">
              <button class="btn-secondary" @click="scheduleMaintenance()">
                <i class="fas fa-calendar"></i> Schedule
              </button>
              <button class="btn-primary" @click="addMaintenance()">
                <i class="fas fa-tools"></i> Log Maintenance
              </button>
            </div>
          </div>
          
          <div class="filter-bar">
            <div class="filter-group">
              <label for="bike-filter">Filter by Bike:</label>
              <select id="bike-filter" x-model="selectedBikeId">
                <option value="all">All Bikes</option>
                ${this.bikes.map(bike => `
                  <option value="${bike.id}">${bike.make} ${bike.model}</option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="tabs">
            <button class="tab-item ${this.activeTab === 'recent' ? 'active' : ''}" 
                    @click="setActiveTab('recent')">Recent</button>
            <button class="tab-item ${this.activeTab === 'upcoming' ? 'active' : ''}" 
                    @click="setActiveTab('upcoming')">Upcoming</button>
            <button class="tab-item ${this.activeTab === 'history' ? 'active' : ''}" 
                    @click="setActiveTab('history')">History</button>
          </div>
          
          <div class="tab-content">
            ${this.getFilteredMaintenance().length === 0 ? `
              <div class="empty-state">
                <p>
                  ${this.activeTab === 'recent' ? 'No recent maintenance records found.' : ''}
                  ${this.activeTab === 'upcoming' ? 'No upcoming maintenance scheduled.' : ''}
                  ${this.activeTab === 'history' ? 'No maintenance history found.' : ''}
                </p>
                <div class="empty-actions">
                  <button class="btn-secondary" @click="scheduleMaintenance()">Schedule Maintenance</button>
                  <button class="btn-primary" @click="addMaintenance()">Log Maintenance</button>
                </div>
              </div>
            ` : this.getFilteredMaintenance().map(item => `
              <div class="maintenance-card ${item.status === 'scheduled' && item.due_date && this.daysUntilDue(item.due_date) <= 7 ? 'upcoming' : ''}">
                <div class="maintenance-icon">
                  <i class="fas ${item.status === 'completed' ? 'fa-check-circle' : 'fa-clock'}"></i>
                </div>
                <div class="maintenance-content">
                  <div class="maintenance-title">${item.description}</div>
                  <div class="maintenance-meta">
                    ${item.status === 'completed' 
                      ? `Completed: ${this.formatDate(item.date)}` 
                      : `Due: ${this.formatDate(item.due_date)} (${this.daysUntilDue(item.due_date)} days)`}
                    • <a href="#" @click.prevent="viewBike(${item.bike_id})">${this.getBikeName(item.bike_id)}</a>
                  </div>
                  ${item.mileage ? `<div class="maintenance-meta">Mileage: ${item.mileage.toLocaleString()} mi</div>` : ''}
                  ${item.cost ? `<div class="maintenance-meta">Cost: ${parseFloat(item.cost).toFixed(2)}</div>` : ''}
                  ${item.notes ? `<div class="maintenance-notes">${item.notes}</div>` : ''}
                </div>
                <div class="maintenance-actions">
                  ${item.status !== 'completed' ? `
                    <button class="btn-secondary" @click="markComplete(${item.id})">Mark Complete</button>
                  ` : ''}
                  <button class="btn-icon danger" title="Delete" @click="deleteMaintenance(${item.id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    };
  }