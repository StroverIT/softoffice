const contactForm = document.querySelector(".contact-form")
let name = document.getElementById("name")
let email = document.getElementById("email")
let problem = document.getElementById("problem")
let message = document.getElementById("message")

contactForm.addEventListener("submit", (e)=>{
    e.preventDefault()

    let formData = {
        name: name.value,
        email: email.value,
        problem: problem.value,
        message: message.value
    }

    let xhr = new XMLHttpRequest()
    xhr.open("POST", "/contactUs")
    xhr.setRequestHeader("content-type", "application/json")
    xhr.onload = function(){
        console.log(xhr.responseText)
        if(xhr.responseText == "success"){
            alert("Email sent")
            name.value = ""
            email.value = ""
            problem.value = ""
            message.value = ""
        }else{
            alert("Something went wrong!")
        }
    }
    xhr.send(JSON.stringify(formData))
})
