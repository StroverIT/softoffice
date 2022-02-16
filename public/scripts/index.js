// Adding search bar menu for icon
$(document).ready(function () {
  const searchIcon = $(".hidden");
  const searchBar = $(".navSearch");
  function animateSearchbar() {
    searchIcon.removeClass("searchOpen");
    searchIcon.unbind();
    if (searchIcon.is(":visible")) {
      // console.log("visible");
      searchIcon.click(() => {
        searchIcon.toggleClass("searchOpen");
        if (searchIcon.hasClass("searchOpen")) {
          searchBar.css({
            display: "inline",
            position: "absolute",
            top: "5vw",
            right: "15vw",
            width: "10px",
          });
          searchBar.show("slow");
          searchBar.animate({
            top: "50px",
            width: "50%",
          });
        } else {
          searchBar.css({
            display: "none",
          });
        }
      });
    } else {
      searchBar.removeAttr("style");
      // console.log("invisible");
    }
  }
  animateSearchbar();
  $(window).resize(animateSearchbar);
});
