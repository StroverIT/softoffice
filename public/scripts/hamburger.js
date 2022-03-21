
$("document").ready(function () {
  let burger = $("#bun");
  function changeNavbarHeight() {
    burger.height($(".navbar").innerHeight());
    burger.width($(".navbar").innerHeight());
  }
  changeNavbarHeight();
  $(window).resize(function () {
    changeNavbarHeight();
    // console.log(burger.innerHeight());
  });

  //Code for sidebar
  var screenHeight = $(window).height();
  var screenWidth = $(window).width();
  var navHeight = $("#main-nav").height();
  var contentHeight = screenHeight - navHeight;

  var delay = 300;
  $(".nav-item").each(function () {
    $(this).css("transition-delay", delay + "ms");
    delay = delay + 100;
  });
  // Black wrap on click
  $(".burgerWrapperBg").click(function(){
    $(this).css("display","none")
    closeOut()
  })
  $("#mobile-nav").height(screenHeight);
  $("#content").css({
    height: contentHeight,
    "margin-top": navHeight,
  });

  $(".nav-item").each(function () {
    if ($(this).next().is(".sub-nav")) {
      $(this).addClass("arrowed");
    } else {
    }
  });
  $("#bun").click(function () {
    closeOut();
  });
  $("#content").click(function () {
    if ($("#container").hasClass("body-slide")) {
      closeOut();
    } else {
 
    }
  });
  $(".arrowed").click(function () {
    let subsection = $(this).next();
    $(this).toggleClass("selected");
    if ($(this).hasClass("selected")) {
      $(".selected").animate({
        boxShadow: "0 0px 12px 3px #333",
      });
    } else {
      $(this).css("boxShadow", "");
    }

    subsection.each(function () {
      $(this).slideUp("slow");
    });
    if (subsection.is(":visible")) {
      subsection.slideUp("slow");
    } else {
      subsection.slideDown("slow");
    }
  });
  // ------- Searchbar ------ \\
  
});
const searchResult = document.getElementById("searchResults")

function sendData(e){
  // console.log(e.value)
  
    fetch("/getProductsSearch", {
      method: "POST",
      headers:{
        "Content-Type": "application/json"
      }, 
      body: JSON.stringify({payload: e.value})
    })
    .then(res=> res.json())
    .then(data=>{
     
      const foundDisplayName = []
      
      console.log("foundData", data);
      data.dataSubsections.map(section=>{
        section[1].map(subsection=>{
          // console.log(subsection);
          if(subsection.nameToDisplay.includes(e.value)){
          foundDisplayName.push({
            section: section[0],
            subsection: subsection.tiput,
            item: subsection.nameToDisplay
          })
          }
        })
      })

      const displayTemplate = document.createElement("template")
      if(foundDisplayName.length == 0 && data.katNomera.length ==0){
        console.log("Not found");
        const notFoundEl = document.createElement("p")
        notFoundEl.classList.add("notFound")
        notFoundEl.textContent = "Няма намерени резултати!"
        searchResult.replaceChildren(notFoundEl)
        return
      }
      if(foundDisplayName.length>0){
        const nameDH5 = document.createElement("h5")
        nameDH5.classList.add("title")
        nameDH5.textContent = "Продукти"
        displayTemplate.content.appendChild(nameDH5)
  
        let displayCounter = 0
    foundDisplay:for(let obj of foundDisplayName){

      if(displayCounter == 5) break foundDisplay

         const ancher = document.createElement("a")
        ancher.setAttribute("href", `/products/${obj.section}/${obj.subsection}`)       
        ancher.textContent = obj.item
        displayTemplate.content.appendChild(ancher)

        displayCounter++
      }

      }
      if(data.katNomera.length> 0){
        const nameDH5 = document.createElement("h5")
        nameDH5.classList.add("title")
        nameDH5.textContent = "Катномера"
        displayTemplate.content.appendChild(nameDH5)
        let displayCounter = 0
        foundDisplay:for(let obj of data.katNomera){
    
          if(displayCounter == 5) break foundDisplay
    
             const ancher = document.createElement("a")
            ancher.setAttribute("href", `/products/${obj.section}/${obj.subsection}`)       
            ancher.textContent =`${obj.subDisplay} - ${obj.katNomer}`
            displayTemplate.content.appendChild(ancher)
            displayCounter++
          }
      }
      
      searchResult.replaceChildren(displayTemplate.content)   
      
    })

}
// Close navsearch
$("#navSearch").focus(function(){
  let navWidth = $(this).innerWidth()
 $("#searchResults").css("width", navWidth)
//  $("#searchResults a").css("width", navWidth)
  $(this).parent().parent().css("z-index","8")
  $("#searchResults").css("display", "block")

  $(".searchWrapper").css("display", "block")
  $(".searchWrapper").click(function(){
    $(this).css("display", "none")
    $("#searchResults").css("display", "none")
  })
})
$(window).resize(function(){
  let navWidth = $("#navSearch").innerWidth()
  $("#searchResults").css("width", navWidth)
  // $("#searchResults a").css("width", navWidth)

})
function closeOut() {
  if(!$('#sidebar').hasClass("nav-slide")){
    console.log("open")
    $('.burgerWrapperBg').css("display","inline-block")
    $("main").css("z-index", 0)
   
  }  
  if($('#sidebar').hasClass("nav-slide")){
    $('.burgerWrapperBg').css("display","none")
      
  }

  $("body").toggleClass("scroll-jam");
  $("#sidebar").toggleClass("nav-slide");
  $("#container").toggleClass("body-slide");
  $(".nav-item").toggleClass("item-slide");
  $(".nav-item").removeClass("selected");
  $(".sub-nav").each(function () {
    $(this).hide();
  });
  triangleRezise();
}

function triangleRezise() {
  if ($("#container").hasClass("body-slide")) {
    $(".triangle").css("transition", "300ms ease");
    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    var navHeight = $("#main-nav").height();
    var triangleHeight = screenHeight - navHeight;
    var triangleWidth = screenWidth - 300;
    var triangleWidth = triangleWidth / 3;
    var triangleWidth = triangleWidth * 2;
    var triangleHeight = triangleHeight * 2;
    var triangleHeight = "" + triangleHeight + "px ";
    var triangleWidth = "" + triangleWidth + "px ";
    var triangle = triangleHeight + triangleWidth + "0px 0px";
    $(".triangle").css("border-width", triangle);
  } else {
    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    var navHeight = $("#main-nav").height();
    var triangleHeight = screenHeight - navHeight;
    var triangleWidth = screenWidth / 3;
    var triangleWidth = triangleWidth * 2;
    var triangleHeight = triangleHeight * 2;
    var triangleHeight = "" + triangleHeight + "px ";
    var triangleWidth = "" + triangleWidth + "px ";
    var triangle = triangleHeight + triangleWidth + "0px 0px";
    $(".triangle").css("border-width", triangle);
    setTimeout(function () {
      $(".triangle").css("transition", "none");
    }, 300);
  }
}
triangleRezise();
$(window).resize(function () {
  triangleRezise();
});
