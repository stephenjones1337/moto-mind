// Dashboard view component
function dashboardView() {
    return {
      stats: {
        totalBikes: 0,
        totalParts: 0,
        upcomingMaintenance: 0
      },
      activities: [],
      upcomingMaintenance: [],
      loading: true,
      
      // Initialize the dashboard
      init() {
        this.fetchDashboardData();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Update the DOM after data is loaded
        this.$watch('loading', () => {
          if (!this.loading) {
            this.$el.innerHTML = this.template();
          }
        });
      },
      
      // Fetch dashboard data
      async fetchDashboardData() {
        try {
          // Fetch bikes to get total count
          const bikesResponse = await api.getBikes();
          if (bikesResponse.success) {
            this.stats.totalBikes = bikesResponse.data.length;
          }
          
          // Fetch upcoming maintenance
          const maintenanceResponse = await api.getMaintenance();
          if (maintenanceResponse.success) {
            const allMaintenance = maintenanceResponse.data;
            
            // Get recent maintenance for activity feed
            this.activities = allMaintenance
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map(item => ({
                type: 'maintenance',
                title: item.description,
                meta: `${item.bike_name} • ${this.formatDate(item.date)}`,
                id: item.id
              }));
            
            // Count upcoming maintenance items (due in next 30 days)
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
            
            this.upcomingMaintenance = allMaintenance
              .filter(item => {
                const dueDate = new Date(item.due_date);
                return dueDate > new Date() && dueDate < thirtyDaysFromNow;
              })
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
              .slice(0, 3);
            
            this.stats.upcomingMaintenance = this.upcomingMaintenance.length;
          }
          
          // Get total parts count - we'll make a dedicated endpoint for stats later
          let totalParts = 0;
          if (bikesResponse.success) {
            for (const bike of bikesResponse.data) {
              const sectionsResponse = await api.getSections(bike.id);
              if (sectionsResponse.success) {
                for (const section of sectionsResponse.data) {
                  const partsResponse = await api.getParts(section.id);
                  if (partsResponse.success) {
                    totalParts += partsResponse.data.length;
                  }
                }
              }
            }
            this.stats.totalParts = totalParts;
          }
          
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          this.$root.addToast('Error loading dashboard data', 'error');
        } finally {
          this.loading = false;
        }
      },
      
      // Format date to relative time (e.g., "2 days ago")
      formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          return 'Today';
        } else if (diffDays === 1) {
          return 'Yesterday';
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
        } else {
          return date.toLocaleDateString();
        }
      },
      
      // Calculate days until maintenance is due
      daysUntilDue(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffTime = Math.abs(due - now);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      
      // View details of a bike
      viewBike(id) {
        this.$root.viewBike(id);
      },
      
      // View details of a maintenance item
      viewMaintenance(id) {
        this.$root.navigateTo('maintenance');
        // TODO: implement selecting specific maintenance item
      },
      
      // Mark maintenance as complete
      async markComplete(id) {
        try {
          const maintenance = this.upcomingMaintenance.find(item => item.id === id);
          if (!maintenance) return;
          
          const response = await api.updateMaintenance(id, {
            ...maintenance,
            status: 'completed',
            completion_date: new Date().toISOString().split('T')[0]
          });
          
          if (response.success) {
            this.$root.addToast('Maintenance marked as complete', 'success');
            this.upcomingMaintenance = this.upcomingMaintenance.filter(item => item.id !== id);
            this.stats.upcomingMaintenance = this.upcomingMaintenance.length;
            
            // Refresh the dashboard
            this.fetchDashboardData();
          }
        } catch (error) {
          console.error('Error marking maintenance as complete:', error);
          this.$root.addToast('Error updating maintenance', 'error');
        }
      },
      
      // Dashboard template
      template() {
        if (this.loading) {
          return `
            <div class="dashboard-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading dashboard...</p>
            </div>
          `;
        }
        
        return `
          <h1 class="page-title">Dashboard</h1>
          
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">Total Bikes</div>
              <div class="stat-value">${this.stats.totalBikes}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-label">Upcoming Maintenance</div>
              <div class="stat-value">${this.stats.upcomingMaintenance}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-label">Total Parts</div>
              <div class="stat-value">${this.stats.totalParts}</div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Recent Activity</h2>
            </div>
            <div class="card-body">
              ${this.activities.length ? this.activities.map(activity => `
                <div class="activity-card">
                  <div class="activity-icon">
                    <i class="fas fa-wrench"></i>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-meta">${activity.meta}</div>
                  </div>
                  <div class="activity-action" @click="viewMaintenance(${activity.id})">View</div>
                </div>
              `).join('') : `
                <div class="empty-state">
                  <p>No recent activity to show</p>
                </div>
              `}
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Upcoming Maintenance</h2>
            </div>
            <div class="card-body">
              ${this.upcomingMaintenance.length ? this.upcomingMaintenance.map(item => `
                <div class="maintenance-card ${this.daysUntilDue(item.due_date) <= 7 ? 'upcoming' : ''}">
                  <div class="maintenance-icon">
                    <i class="fas fa-tools"></i>
                  </div>
                  <div class="maintenance-content">
                    <div class="maintenance-title">${item.description}</div>
                    <div class="maintenance-meta">Due in ${this.daysUntilDue(item.due_date)} days • ${item.bike_name}</div>
                    <div class="maintenance-meta">Last performed: ${item.last_performed ? this.formatDate(item.last_performed) : 'Never'}</div>
                  </div>
                  <button class="maintenance-action" @click="markComplete(${item.id})">Mark Complete</button>
                </div>
              `).join('') : `
                <div class="empty-state">
                  <p>No upcoming maintenance</p>
                </div>
              `}
            </div>
          </div>
        `;
      }
    };
  }