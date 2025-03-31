// Bikes list view component
function bikesView() {
    return {
      bikes: [],
      garages: [],
      filteredBikes: [],
      loading: true,
      garageFilter: 'all',
      sortBy: 'make',
      sortDir: 'asc',
      
      // Initialize the bikes view
      init() {
        this.fetchData();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Update the DOM after data is loaded
        this.$watch('loading', () => {
          if (!this.loading) {
            this.applyFilters();
            this.$el.innerHTML = this.template();
          }
        });
        
        // Watch for filter changes
        this.$watch('garageFilter', () => this.applyFilters());
        this.$watch('sortBy', () => this.applyFilters());
        this.$watch('sortDir', () => this.applyFilters());
      },
      
      // Fetch bikes and garages data
      async fetchData() {
        try {
          // Fetch bikes
          const bikesResponse = await api.getBikes();
          if (bikesResponse.success) {
            this.bikes = bikesResponse.data;
          }
          
          // Fetch garages for filtering
          const garagesResponse = await api.getGarages();
          if (garagesResponse.success) {
            this.garages = garagesResponse.data;
          }
        } catch (error) {
          console.error('Error fetching bikes data:', error);
          this.$root.addToast('Error loading bikes data', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Apply filters and sorting
      applyFilters() {
        // First apply garage filter
        if (this.garageFilter === 'all') {
          this.filteredBikes = [...this.bikes];
        } else {
          const garageId = parseInt(this.garageFilter);
          this.filteredBikes = this.bikes.filter(bike => bike.garage_id === garageId);
        }
        
        // Then apply sorting
        this.filteredBikes.sort((a, b) => {
          let aValue = a[this.sortBy];
          let bValue = b[this.sortBy];
          
          // Handle special sorting cases
          if (this.sortBy === 'name') {
            aValue = `${a.make} ${a.model}`;
            bValue = `${b.make} ${b.model}`;
          } else if (this.sortBy === 'garage') {
            const aGarage = this.garages.find(g => g.id === a.garage_id);
            const bGarage = this.garages.find(g => g.id === b.garage_id);
            aValue = aGarage ? aGarage.name : '';
            bValue = bGarage ? bGarage.name : '';
          }
          
          // Compare values based on sort direction
          if (this.sortDir === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      },
      
      // View a specific bike
      viewBike(id) {
        this.$root.viewBike(id);
      },
      
      // Delete a bike
      async deleteBike(id) {
        if (!confirm('Are you sure you want to delete this bike? This action cannot be undone.')) {
          return;
        }
        
        try {
          const response = await api.deleteBike(id);
          if (response.success) {
            this.$root.addToast('Bike deleted successfully', 'success');
            this.bikes = this.bikes.filter(bike => bike.id !== id);
            this.applyFilters();
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error deleting bike:', error);
          this.$root.addToast('Error deleting bike', 'error');
        }
      },
      
      // Open the add bike modal
      openAddBikeModal() {
        const modalContent = `
          <form id="add-bike-form" @submit.prevent="submitBikeForm">
            <div class="form-group">
              <label for="bike-make" class="form-label">Make *</label>
              <input type="text" id="bike-make" required>
            </div>
            
            <div class="form-group">
              <label for="bike-model" class="form-label">Model *</label>
              <input type="text" id="bike-model" required>
            </div>
            
            <div class="form-group">
              <label for="bike-year" class="form-label">Year</label>
              <input type="number" id="bike-year" min="1885" max="${new Date().getFullYear() + 1}">
            </div>
            
            <div class="form-group">
              <label for="bike-garage" class="form-label">Garage *</label>
              <select id="bike-garage" required>
                ${this.garages.map(garage => `
                  <option value="${garage.id}">${garage.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="bike-vin" class="form-label">VIN</label>
              <input type="text" id="bike-vin">
            </div>
            
            <div class="form-group">
              <label for="bike-purchase-date" class="form-label">Purchase Date</label>
              <input type="date" id="bike-purchase-date">
            </div>
            
            <div class="form-group">
              <label for="bike-mileage" class="form-label">Current Mileage</label>
              <input type="number" id="bike-mileage" min="0">
            </div>
            
            <div class="form-group">
              <label for="bike-notes" class="form-label">Notes</label>
              <textarea id="bike-notes" rows="3"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="secondary" @click="$root.closeModal()">Cancel</button>
              <button type="submit">Add Bike</button>
            </div>
          </form>
        `;
        
        this.$root.openModal('Add New Bike', modalContent);
        
        // Add form submission handler after the modal is opened
        document.getElementById('add-bike-form').addEventListener('submit', this.submitBikeForm.bind(this));
      },
      
      // Handle bike form submission
      async submitBikeForm(event) {
        event.preventDefault();
        
        const bikeData = {
          make: document.getElementById('bike-make').value,
          model: document.getElementById('bike-model').value,
          year: document.getElementById('bike-year').value || null,
          garage_id: parseInt(document.getElementById('bike-garage').value),
          vin: document.getElementById('bike-vin').value || null,
          purchase_date: document.getElementById('bike-purchase-date').value || null,
          current_mileage: document.getElementById('bike-mileage').value || 0,
          notes: document.getElementById('bike-notes').value || null
        };
        
        try {
          const response = await api.createBike(bikeData);
          
          if (response.success) {
            this.$root.closeModal();
            this.$root.addToast('Bike added successfully', 'success');
            
            // Add the new bike to the list and refresh the view
            this.bikes.push(response.data);
            this.applyFilters();
            this.$el.innerHTML = this.template();
          }
        } catch (error) {
          console.error('Error adding bike:', error);
          this.$root.addToast('Error adding bike', 'error');
        }
      },
      
      // Get garage name by ID
      getGarageName(garageId) {
        const garage = this.garages.find(g => g.id === garageId);
        return garage ? garage.name : 'Unknown';
      },
      
      // Toggle sort direction
      toggleSort(field) {
        if (this.sortBy === field) {
          this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = field;
          this.sortDir = 'asc';
        }
        
        this.applyFilters();
        this.$el.innerHTML = this.template();
      },
      
      // Bikes view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading bikes...</p>
            </div>
          `;
        }
        
        return `
          <div class="page-header">
            <h1 class="page-title">All Bikes</h1>
            <button @click="openAddBikeModal()" class="btn-primary">
              <i class="fas fa-plus"></i> Add Bike
            </button>
          </div>
          
          <div class="filters-bar">
            <div class="filter-group">
              <label for="garage-filter">Garage:</label>
              <select id="garage-filter" @change="garageFilter = $event.target.value; applyFilters(); $el.innerHTML = template()">
                <option value="all">All Garages</option>
                ${this.garages.map(garage => `
                  <option value="${garage.id}" ${this.garageFilter == garage.id ? 'selected' : ''}>
                    ${garage.name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="card">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th @click="toggleSort('name')">
                      Bike
                      ${this.sortBy === 'name' ? `<i class="fas fa-caret-${this.sortDir === 'asc' ? 'up' : 'down'}"></i>` : ''}
                    </th>
                    <th @click="toggleSort('year')">
                      Year
                      ${this.sortBy === 'year' ? `<i class="fas fa-caret-${this.sortDir === 'asc' ? 'up' : 'down'}"></i>` : ''}
                    </th>
                    <th @click="toggleSort('current_mileage')">
                      Mileage
                      ${this.sortBy === 'current_mileage' ? `<i class="fas fa-caret-${this.sortDir === 'asc' ? 'up' : 'down'}"></i>` : ''}
                    </th>
                    <th @click="toggleSort('garage')">
                      Garage
                      ${this.sortBy === 'garage' ? `<i class="fas fa-caret-${this.sortDir === 'asc' ? 'up' : 'down'}"></i>` : ''}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.filteredBikes.length ? this.filteredBikes.map(bike => `
                    <tr>
                      <td>
                        <div class="bike-name">${bike.make} ${bike.model}</div>
                      </td>
                      <td>${bike.year || '-'}</td>
                      <td>${bike.current_mileage ? `${bike.current_mileage.toLocaleString()} mi` : '-'}</td>
                      <td>${this.getGarageName(bike.garage_id)}</td>
                      <td class="actions-cell">
                        <button class="btn-icon" title="View Bike" @click="viewBike(${bike.id})">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" title="Edit Bike" @click="editBike(${bike.id})">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon danger" title="Delete Bike" @click="deleteBike(${bike.id})">
                          <i class="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="5" class="empty-table-message">
                        No bikes found. Add your first bike to get started.
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    }
}