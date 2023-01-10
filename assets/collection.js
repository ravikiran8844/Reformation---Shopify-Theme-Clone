function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  
  class CollectionFilters extends HTMLElement {
    constructor() {
      super();
  
      this.debouncedOnSubmit = debounce((event) => {
        this.onSubmitHandler(event);
      }, 500);
      
      const filterForm = this.querySelector('form');
      filterForm.addEventListener('input', this.debouncedOnSubmit.bind(this));
  
      this.previousElementSibling.addEventListener('click', this.closeFilterDrawer);
      this.querySelector('.collection-filters__close').addEventListener('click', this.closeFilterDrawer);
    }
  
    onSubmitHandler(event) {
      event.preventDefault();
      const forms = [];
      const sortFilterForms = document.querySelectorAll('collection-filters form');
  
      sortFilterForms.forEach((form) => {
        forms.push(CollectionFilters.createSearchParams(form));
      })
  
      const filterParams = forms.join('&');
      CollectionFilters.updateURLHash(filterParams);
      CollectionFilters.renderPage(filterParams, event);
    }
  
    static createSearchParams(form) {
      const formData = new FormData(form);
      return new URLSearchParams(formData).toString();
    }
  
    static updateURLHash(filterParams) {
      history.pushState({ filterParams }, '', `${window.location.pathname}${filterParams && '?'.concat(filterParams)}`);
    }
  
    static renderPage(filterParams, event) {
      const sectionId = document.getElementById('ProductGrid').dataset.id;
      const url = `${window.location.pathname}?section_id=${sectionId}&${filterParams}`;
      
      fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        CollectionFilters.renderProductGrid(responseText);
      });
    }
  
    static renderProductGrid(responseText) {
      const productGridHtml = new DOMParser().parseFromString(responseText, 'text/html').getElementById('ProductGridContainer').innerHTML;
      document.getElementById('ProductGridContainer').innerHTML = productGridHtml;
    }
  
    closeFilterDrawer() {
      const filterContainer = document.getElementById('CollectionFilters');
      filterContainer.classList.remove('is--open');
      document.body.classList.remove('overflow-hidden');
    }
  }
  customElements.define('collection-filters', CollectionFilters);
  
  
  
  class CollectionStickyButton extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('click', this.onClickHandler.bind(this));
    }
  
    onClickHandler(event) {
      const filterContainer = document.getElementById('CollectionFilters');
      if(!filterContainer) return;
     
      filterContainer.classList.add('is--open');
      document.body.classList.add('overflow-hidden');
    }
  }
  customElements.define('collection-sticky-button', CollectionStickyButton);
  
  
  
  class PriceRange extends HTMLElement {
    constructor() {
      super();
      this.querySelectorAll('input')
        .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));
      this.setMinAndMaxValues();
    }
  
    onRangeChange(event) {
      this.adjustToValidValues(event.currentTarget);
      this.setMinAndMaxValues();
    }
  
    setMinAndMaxValues() {
      const inputs = this.querySelectorAll('input');
      const minInput = inputs[0];
      const maxInput = inputs[1];
      if (maxInput.value) minInput.setAttribute('max', maxInput.value);
      if (minInput.value) maxInput.setAttribute('min', minInput.value);
      if (minInput.value === '') maxInput.setAttribute('min', 0);
      if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
    }
  
    adjustToValidValues(input) {
      const value = Number(input.value);
      const min = Number(input.getAttribute('min'));
      const max = Number(input.getAttribute('max'));
  
      if (value < min) input.value = min;
      if (value > max) input.value = max;
    }
  }
  customElements.define('price-range', PriceRange);