class ProductCard extends HTMLElement {
    constructor() {
      super();
  
      this.variantData = JSON.parse(this.querySelector('[type="application/json"]').textContent);
      this.addEventListener('change', this.onOptionChange.bind(this));
    }
  
    onOptionChange() {   
      // Create the array of selected options
      const optionContainers = Array.from(this.querySelectorAll('.product-card__options'));
      this.options = optionContainers.map((options) => {
        return Array.from(options.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
  
      //Get the variant object of selected options
      this.currentVariant = this.variantData.find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
  
      //Update the master selector
      const variantId = this.currentVariant.id;
      this.querySelector('[name="id"]').value = variantId;
  
      //Update the card
      this.refreshCard();
    }
  
    refreshCard() {
      let variantUrl = `/products/${this.dataset.handle}?view=card&variant=${this.currentVariant.id}`;
    
      fetch(variantUrl)
        .then((response)=> response.text())
        .then((data)=> {
          const html = new DOMParser().parseFromString(data, 'text/html');
          const responseCard = html.querySelector('product-card');
          this.innerHTML = responseCard.innerHTML;
        })
    }
  }
  customElements.define('product-card', ProductCard);