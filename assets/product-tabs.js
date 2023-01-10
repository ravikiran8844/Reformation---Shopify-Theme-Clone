document.querySelectorAll(".tab__heading").forEach((head) => {
  head.addEventListener("click", (event) => {
    event.preventDefault();
    let tab = head.dataset.tab;
    document
      .querySelectorAll(".tab__heading")
      .forEach((h) => h.classList.remove("is--active"));
    document
      .querySelectorAll(".tab__content")
      .forEach((c) => c.classList.remove("is--active"));
    head.classList.add("is--active");
    console.log("#" + tab);
    document.querySelector("#" + tab).classList.add("is--active");
  });
});