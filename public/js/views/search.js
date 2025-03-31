// Search results view component
function searchResultsView(searchQuery) {
    return {
      query: '',
      results: null,
      tags: [],
      selectedTags: [],
      entityFilter: 'all',
      loading: true,
      
      // Initialize the search view
      init() {
        this.query = this.searchQuery || '';
        this.performSearch();
        
        // Render template
        this.$el.innerHTML = this.template();
        
        // Watch for filter changes
        this.$watch('selectedTags', () => {
          this.performSearch();
        });
        
        this.$watch('entityFilter', () => {
          this.$el.innerHTML = this.template();
        });
      },
      
      // Perform search with current query and filters
      async performSearch() {
        if (!this.query.trim()) {
          this.loading = false;
          this.results = null;
          this.$el.innerHTML = this.template();
          return;
        }
        
        try {
          this.loading = true;
          
          // Fetch all tags first (if we haven't already)
          if (this.tags.length === 0) {
            const tagsResponse = await api.getTags();
            if (tagsResponse.success) {
              this.tags = tagsResponse.data;
            }
          }
          
          // Perform the search
          const response = await api.search(
            this.query, 
            this.selectedTags.map(id => {
              const tag = this.tags.find(t => t.id === id);
              return tag ? tag.name : '';
            }),
            this.entityFilter !== 'all' ? this.entityFilter : null
          );
          
          if (response.success) {
            this.results = response.data;
          }
        } catch (error) {
          console.error('Error performing search:', error);
          this.$root.addToast('Error performing search', 'error');
          this.results = null;
        } finally {
          this.loading = false;
          this.$el.innerHTML = this.template();
        }
      },
      
      // Toggle tag selection for filtering
      toggleTagFilter(tagId) {
        if (this.selectedTags.includes(tagId)) {
          this.selectedTags = this.selectedTags.filter(id => id !== tagId);
        } else {
          this.selectedTags.push(tagId);
        }
      },
      
      // Set entity filter
      setEntityFilter(type) {
        this.entityFilter = type;
      },
      
      // Total count of search results
      getTotalResultsCount() {
        if (!this.results) return 0;
        
        return this.results.garages.length +
               this.results.bikes.length +
               this.results.sections.length +
               this.results.parts.length;
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
      
      // Search view template
      template() {
        if (this.loading) {
          return `
            <div class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Searching...</p>
            </div>
          `;
        }
        
        return `
          <div class="page-header">
            <h1 class="page-title">Search Results</h1>
          </div>
          
          <div class="search-header">
            <div class="search-query">
              <form @submit.prevent="performSearch()" class="search-form">
                <input type="text" x-model="query" placeholder="Search..." class="search-input">
                <button type="submit" class="search-button">
                  <i class="fas fa-search"></i> Search
                </button>
              </form>
            </div>
            
            <div class="search-filters">
              <div class="entity-filter">
                <button class="filter-button ${this.entityFilter === 'all' ? 'active' : ''}" 
                        @click="setEntityFilter('all')">All</button>
                <button class="filter-button ${this.entityFilter === 'garage' ? 'active' : ''}" 
                        @click="setEntityFilter('garage')">Garages</button>
                <button class="filter-button ${this.entityFilter === 'bike' ? 'active' : ''}" 
                        @click="setEntityFilter('bike')">Bikes</button>
                <button class="filter-button ${this.entityFilter === 'section' ? 'active' : ''}" 
                        @click="setEntityFilter('section')">Sections</button>
                <button class="filter-button ${this.entityFilter === 'part' ? 'active' : ''}" 
                        @click="setEntityFilter('part')">Parts</button>
              </div>
            </div>
          </div>
          
          <div class="content-with-sidebar">
            <div class="main-content">
              ${!this.results ? `
                <div class="empty-state">
                  <p>Enter a search term to find bikes, parts, and more.</p>
                </div>
              ` : this.getTotalResultsCount() === 0 ? `
                <div class="empty-state">
                  <p>No results found for "${this.query}"</p>
                  <p>Try different keywords or filters.</p>
                </div>
              ` : `
                <div class="search-results">
                  <div class="results-summary">
                    Found ${this.getTotalResultsCount()} results for "${this.query}"
                  </div>
                  
                  ${(this.entityFilter === 'all' || this.entityFilter === 'garage') && this.results.garages.length > 0 ? `
                    <div class="result-section">
                      <h2 class="result-section-title">Garages (${this.results.garages.length})</h2>
                      ${this.results.garages.map(garage => `
                        <div class="result-card">
                          <div class="result-content">
                            <div class="result-title">${garage.name}</div>
                            <div class="result-meta">${garage.location || 'No location'}</div>
                            ${garage.tags && garage.tags.length > 0 ? `
                              <div class="result-tags">
                                ${garage.tags.map(tag => `
                                  <div class="tag small" style="background-color: ${tag.color}20; color: ${tag.color};">
                                    ${tag.name}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                          <div class="result-actions">
                            <button class="btn-link" @click="viewItem('garage', ${garage.id})">View</button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${(this.entityFilter === 'all' || this.entityFilter === 'bike') && this.results.bikes.length > 0 ? `
                    <div class="result-section">
                      <h2 class="result-section-title">Bikes (${this.results.bikes.length})</h2>
                      ${this.results.bikes.map(bike => `
                        <div class="result-card">
                          <div class="result-content">
                            <div class="result-title">${bike.make} ${bike.model}</div>
                            <div class="result-meta">
                              ${bike.year ? `${bike.year} • ` : ''}
                              ${bike.garage_name || 'Unknown garage'}
                            </div>
                            ${bike.tags && bike.tags.length > 0 ? `
                              <div class="result-tags">
                                ${bike.tags.map(tag => `
                                  <div class="tag small" style="background-color: ${tag.color}20; color: ${tag.color};">
                                    ${tag.name}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                          <div class="result-actions">
                            <button class="btn-link" @click="viewItem('bike', ${bike.id})">View</button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${(this.entityFilter === 'all' || this.entityFilter === 'section') && this.results.sections.length > 0 ? `
                    <div class="result-section">
                      <h2 class="result-section-title">Sections (${this.results.sections.length})</h2>
                      ${this.results.sections.map(section => `
                        <div class="result-card">
                          <div class="result-content">
                            <div class="result-title">${section.name}</div>
                            <div class="result-meta">
                              ${section.make} ${section.model} • ${section.garage_name || 'Unknown garage'}
                            </div>
                            ${section.tags && section.tags.length > 0 ? `
                              <div class="result-tags">
                                ${section.tags.map(tag => `
                                  <div class="tag small" style="background-color: ${tag.color}20; color: ${tag.color};">
                                    ${tag.name}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                          <div class="result-actions">
                            <button class="btn-link" @click="viewItem('section', ${section.id})">View</button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  
                  ${(this.entityFilter === 'all' || this.entityFilter === 'part') && this.results.parts.length > 0 ? `
                    <div class="result-section">
                      <h2 class="result-section-title">Parts (${this.results.parts.length})</h2>
                      ${this.results.parts.map(part => `
                        <div class="result-card">
                          <div class="result-content">
                            <div class="result-title">${part.name}</div>
                            <div class="result-meta">
                              ${part.section_name} • ${part.make} ${part.model}
                            </div>
                            ${part.part_number ? `<div class="result-meta">Part #: ${part.part_number}</div>` : ''}
                            ${part.tags && part.tags.length > 0 ? `
                              <div class="result-tags">
                                ${part.tags.map(tag => `
                                  <div class="tag small" style="background-color: ${tag.color}20; color: ${tag.color};">
                                    ${tag.name}
                                  </div>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                          <div class="result-actions">
                            <button class="btn-link" @click="viewItem('part', ${part.id})">View</button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `}
            </div>
            
            <div class="sidebar-panel">
              <div class="panel-section">
                <h3 class="panel-title">Filter by Tags</h3>
                <div class="tags-container">
                  ${this.tags.map(tag => `
                    <div class="tag filter-tag ${this.selectedTags.includes(tag.id) ? 'selected' : ''}" 
                         style="background-color: ${this.selectedTags.includes(tag.id) ? tag.color : tag.color + '20'}; 
                                color: ${this.selectedTags.includes(tag.id) ? 'white' : tag.color};"
                         @click="toggleTagFilter(${tag.id})">
                      ${tag.name}
                    </div>
                  `).join('')}
                  
                  ${this.tags.length === 0 ? `
                    <p class="no-tags-message">No tags created yet</p>
                  ` : ''}
                </div>
              </div>
              
              <div class="panel-section">
                <h3 class="panel-title">Search Tips</h3>
                <ul class="search-tips">
                  <li>Search for bike models, part names, or descriptions</li>
                  <li>Use specific part numbers for exact matches</li>
                  <li>Filter by tags to narrow results</li>
                  <li>Use the entity filter to focus on specific types</li>
                </ul>
              </div>
            </div>
          </div>
        `;
      }
    };
  }