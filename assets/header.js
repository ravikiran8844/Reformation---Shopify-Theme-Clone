const toggleButton = document.getElementsByClassName('toggle-button')[0]
  const navbarLinks = document.getElementsByClassName('shopify-header-menu')[0]

  toggleButton.addEventListenenr('click', () => {
    navbarLinks.classList.toggle('active')
  })