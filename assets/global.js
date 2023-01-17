document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};


/* product.js */

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


class PincodeChecker extends HTMLElement {
  constructor() {
    super();
    this.pincodeJson = {};
    this.sheetKey = '1ZtAP_hh5rODXWK3efbbV2MG1nMJy-9rVCMIJj7elXqY';
    this.apiKey = 'AIzaSyAkMQFMHTPblM4CpwBp9QATLnYo5ISnDCM';
    this.pincodeInput = this.querySelector('[name="pincode-input"]');
    this.pincodeSubmitBtn = this.querySelector('[name="pincode-submit"]');
    this.pincodeMessage = this.querySelector('[name="pincode-message"]');
    this.sheetUrl = "https://sheets.googleapis.com/v4/spreadsheets/" + this.sheetKey + "/values/Sheet1?key=" + this.apiKey;

    this.getPincodeJson();
    this.pincodeSubmitBtn.addEventListener('click', this.validatePincode.bind(this));
    
    //COSMETICS :: CLEAR INPUT ON CLICK :: ALLOW ONLY NUMBERS
    this.pincodeInput.addEventListener('click', this.clearInput.bind(this));
    this.pincodeInput.addEventListener('keypress', function(e) {
      if (e.which < 48 || e.which > 57 || e.target.value.length === 6) 
        e.preventDefault();
    });
  }

  getPincodeJson() {
    if (sessionStorage.getItem("pincodeData") === null) {
      fetch(this.sheetUrl)
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        let sheetData = JSON.stringify(data.values);
        sessionStorage.setItem("pincodeData", sheetData);        
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
    }
  }
  
  validatePincode() {
    if(this.pincodeInput.value.length === 6) {      
      this.pincodeJson = JSON.parse(sessionStorage.getItem("pincodeData"));
      this.jsonResult = {
        pincodeServiceable: 'No',
        estimatedDelivery: 1
      };

      for (let i=0; i<this.pincodeJson.length; i++) {
        if (this.pincodeJson[i] && this.pincodeJson[i][0] == this.pincodeInput.value) {
          this.jsonResult.pincodeServiceable = this.pincodeJson[i][0];
          this.jsonResult.estimatedDelivery = this.pincodeJson[i][1];
          break;
        }
      }

      if(this.jsonResult.pincodeServiceable.toLowerCase() !== 'no') {
        let successHtml = '';

        if(this.jsonResult.estimatedDelivery != '') {
          let today = new Date();
          let formatDay = { weekday: 'short' };
          let formatDate = { day: 'numeric' };
          let formatMonth = { month: 'short' };

          let estimatedDayResponse = parseInt(this.jsonResult.estimatedDelivery) + 1;
          let estimatedDate = today.setDate(today.getDate() + estimatedDayResponse);
          let estimatedDeliveryDate = new Date(estimatedDate).toLocaleDateString("en-US", formatDay) + ', ' + new Date(estimatedDate).toLocaleDateString("en-US", formatDate) + ' ' + new Date(estimatedDate).toLocaleDateString("en-US", formatMonth);

          successHtml += '<div class="pincode-message__item">Estimated delivery: <span>'+ estimatedDeliveryDate +'</span></div>';
        }  

        this.pincodeMessage.innerHTML = successHtml;
        this.pincodeMessage.classList.add('is-success');
        this.pincodeMessage.classList.remove('is-error', 'is-hidden');
      } 
      else {
        //IF THE ENTERED PINCODE DOESN'T MATCH WITH THE SHEET PINCODES OR UNSERVICEABLE
        let errorHtml = '<div class="pincode-message__item">Sorry, this pincode is not serviceable yet!</div>';

        this.pincodeMessage.innerHTML = errorHtml;
        this.pincodeMessage.classList.add('is-error');
        this.pincodeMessage.classList.remove('is-success', 'is-hidden');
      }
    } 
    else {
      //IF THE PINCODE IS NOT 6 DIGITS
      let errorHtml = '<div class="pincode-message__item">Please enter a valid pincode</div>';

      this.pincodeMessage.innerHTML = errorHtml;
      this.pincodeMessage.classList.add('is-error');
      this.pincodeMessage.classList.remove('is-success', 'is-hidden');
    }  
  }

  clearInput() {
    this.pincodeInput.value = '';
    this.pincodeMessage.innerHTML = '';
    this.pincodeMessage.classList.add('is-hidden');
    this.pincodeMessage.classList.remove('is-success', 'is-error');
  }
}

customElements.define('pincode-checker', PincodeChecker);


/**
 *  @class
 *  @function FeaturedCollectionList
 */
if (!customElements.get('featured-collection-list')) {
  class FeaturedCollectionList extends HTMLElement {
      constructor() {
          super();
          this.images = this.querySelectorAll('.featured-collection-list--img');
          this.buttons = Array.from(this.querySelectorAll('.featured-collection-list--button'));
          if (document.body.classList.contains('animations-true') && typeof gsap !== 'undefined') {
              this.prepareAnimations();
          }
      }
      connectedCallback() {
          this.buttons.forEach((button, i) => {
              button.addEventListener('mouseover', (event) => {
                  this.onHover(event, button, i);
              });
          });
          if (Shopify.designMode) {
              this.addEventListener('shopify:block:select', (event) => {
                  let index = this.buttons.indexOf(event.target);
                  this.buttons[index].dispatchEvent(new Event('mouseover'));
              });
          }
      }
      prepareAnimations() {
          let section = this,
              tl = gsap.timeline({
                  scrollTrigger: {
                      trigger: section.querySelector('.featured-collection-list--inner--content'),
                      start: "top 70%"
                  }
              });
          tl.
          from(section.buttons, {
              opacity: 0,
              duration: 0.5 + section.buttons.length * 0.1,
              stagger: 0.1
          });
      }
      onHover(event, button, i) {
          this.images.forEach((image, index) => {
              image.classList.remove('active');
              if (i == index) {
                  image.classList.add('active');
              }
          });
          this.buttons.forEach((this_button, index) => {
              this_button.classList.remove('active');
          });
          button.classList.add('active');
      }
  }
  customElements.define('featured-collection-list', FeaturedCollectionList);
}


/**
 *  @class
 *  @function CountdownTimer
 */
if (!customElements.get('countdown-timer')) {
  class CountdownTimer extends HTMLElement {
      constructor() {
          super();
          const date = this.dataset.date.split('-'),
              day = parseInt(date[0]),
              month = parseInt(date[1]),
              year = parseInt(date[2]);
          let time = this.dataset.time,
              tarhour, tarmin;
          if (time != null) {
              time = time.split(':');
              tarhour = parseInt(time[0]);
              tarmin = parseInt(time[1]);
          }
          let dateNow = new Date();
          // Set the date we're counting down to
          this.countDownDate = new Date(year, month - 1, day, tarhour, tarmin, 0, 0).getTime();
      }
      connectedCallback() {
          let _this = this;
          const updateTime = function() {
              // Get todays date and time
              const now = new Date().getTime();
              // Find the distance between now an the count down date
              const distance = _this.countDownDate - now;
              // Time calculations for days, hours, minutes and seconds
              const days = Math.floor(distance / (1000 * 60 * 60 * 24));
              const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);
              if (distance < 0) {
                  _this.querySelector('.days .countdown-timer--column--number').innerHTML = 0;
                  _this.querySelector('.hours .countdown-timer--column--number').innerHTML = 0;
                  _this.querySelector('.minutes .countdown-timer--column--number').innerHTML = 0;
                  _this.querySelector('.seconds .countdown-timer--column--number').innerHTML = 0;
              } else {
                  requestAnimationFrame(updateTime);
                  _this.querySelector('.days .countdown-timer--column--number').innerHTML = CountdownTimer.addZero(days);
                  _this.querySelector('.hours .countdown-timer--column--number').innerHTML = CountdownTimer.addZero(hours);
                  _this.querySelector('.minutes .countdown-timer--column--number').innerHTML = CountdownTimer.addZero(minutes);
                  _this.querySelector('.seconds .countdown-timer--column--number').innerHTML = CountdownTimer.addZero(seconds);
              }
          };
          requestAnimationFrame(updateTime);
      }
      static addZero(x) {
          return (x < 10 && x >= 0) ? "0" + x : x;
      }
  }
  customElements.define('countdown-timer', CountdownTimer);
}




#modal js
let modal = document.getElementById("myModal");
  let btn = document.getElementById("myBtn");
  let span = document.getElementsByClassName("close")[0];
  const createMod = document.getElementById("register_modal");
  const createMod2 = document.getElementById("login_modal");

  function createAcc() {
    createMod.style.display = "block";
    document.getElementById("login_modal").style.display = "none";
  }
  function signInRedirect() {
    createMod2.style.display = "block";
    document.getElementById("register_modal").style.display = "none";
  }

  btn.onclick = function() {

    modal.style.display = "block";

  };

  span.onclick = function() {
    modal.style.display = "none";
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };