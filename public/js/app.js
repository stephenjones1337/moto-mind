// Main application Alpine.js component
function app() {
    return {
      // Global state
      currentView: 'dashboard',
      selectedGarageId: null,
      selectedBikeId: null,
      selectedSectionId: null,
      selectedPartId: null,
      searchQuery: '',
      garages: [],
      bikes: [],
      
      // UI state
      isMobile: window.innerWidth < 768,
      showSidebar: false,
      showModal: false,
      modalTitle: '',
      modalContent: '',
      toasts: [],
      
      // Initialize the application
      init() {
        this.checkScreenSize();
        window.addEventListener('resize', () => this.checkScreenSize());
        
        // Load initial data
        this.fetchGarages();
        this.fetchBikes();
        
        // Check if URL has a hash
        this.handleInitialRoute();
        
        // Listen for navigation events
        window.addEventListener('popstate', () => this.handleRouteChange());
      },
      
      // Check screen size for responsive design
      checkScreenSize() {
        this.isMobile = window.innerWidth < 768;
        if (!this.isMobile) {
          this.showSidebar = false;
        }
      },
      
      // Handle initial route from URL hash
      handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        if (hash) {
          const parts = hash.split('/');
          const view = parts[0];
          
          if (this.isValidView(view)) {
            this.currentView = view;
            
            // Handle IDs in the route
            if (parts.length > 1 && parts[1]) {
              switch (view) {
                case 'garage':
                  this.selectedGarageId = parseInt(parts[1]);
                  break;
                case 'bike':
                  this.selectedBikeId = parseInt(parts[1]);
                  break;
                case 'section':
                  this.selectedSectionId = parseInt(parts[1]);
                  break;
                case 'part':
                  this.selectedPartId = parseInt(parts[1]);
                  break;
              }
            }
          }
        }
      },
      
      // Handle route changes
      handleRouteChange() {
        this.handleInitialRoute();
      },
      
      // Validate if a view exists
      isValidView(view) {
        const validViews = [
          'dashboard', 'garages', 'bikes', 'bike', 
          'sections', 'parts', 'maintenance', 'tags', 'search',
          'garage', 'section', 'part'
        ];
        return validViews.includes(view);
      },
      
      // Navigation
      navigateTo(view, id = null) {
        if (this.isValidView(view)) {
          this.currentView = view;
          
          // Reset selections unless specifically navigating to a detail view
          if (!['bike', 'garage', 'section', 'part'].includes(view)) {
            this.selectedGarageId = null;
            this.selectedBikeId = null;
            this.selectedSectionId = null;
            this.selectedPartId = null;
          }
          
          // Update URL
          let url = `#${view}`;
          if (id) {
            url += `/${id}`;
          }
          window.history.pushState({}, '', url);
          
          // Close sidebar on mobile
          if (this.isMobile) {
            this.showSidebar = false;
          }
        }
      },
      
      // View specific entity details
      viewGarage(id) {
        this.selectedGarageId = id;
        this.navigateTo('garage', id);
      },
      
      viewBike(id) {
        this.selectedBikeId = id;
        this.navigateTo('bike', id);
      },
      
      viewSection(id) {
        this.selectedSectionId = id;
        this.navigateTo('section', id);
      },
      
      viewPart(id) {
        this.selectedPartId = id;
        this.navigateTo('part', id);
      },
      
      // Search
      performSearch() {
        if (this.searchQuery.trim()) {
          this.navigateTo('search');
        }
      },
      
      // Modal functions
      openModal(title, content) {
        this.modalTitle = title;
        this.modalContent = content;
        this.showModal = true;
      },
      
      closeModal() {
        this.showModal = false;
      },
      
      // Toast notifications
      addToast(message, type = 'info') {
        const toast = { message, type };
        this.toasts.push(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          this.removeToast(this.toasts.indexOf(toast));
        }, 5000);
      },
      
      removeToast(index) {
        if (index > -1) {
          this.toasts.splice(index, 1);
        }
      },
      
      getToastIcon(type) {
        switch (type) {
          case 'success': return 'fa-check-circle';
          case 'warning': return 'fa-exclamation-triangle';
          case 'error': return 'fa-times-circle';
          default: return 'fa-info-circle';
        }
      },
      
      // API Calls
      async fetchGarages() {
        try {
          const response = await api.getGarages();
          if (response.success) {
            this.garages = response.data;
          } else {
            this.addToast('Failed to load garages', 'error');
          }
        } catch (error) {
          console.error('Error fetching garages:', error);
          this.addToast('Error loading garages', 'error');
        }
      },
      
      async fetchBikes() {
        try {
          const response = await api.getBikes();
          if (response.success) {
            this.bikes = response.data;
          } else {
            this.addToast('Failed to load bikes', 'error');
          }
        } catch (error) {
          console.error('Error fetching bikes:', error);
          this.addToast('Error loading bikes', 'error');
        }
      }
    };
  }