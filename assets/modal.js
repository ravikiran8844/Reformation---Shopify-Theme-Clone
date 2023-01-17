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