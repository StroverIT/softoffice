<script>
$(document).ready(function(){
    fetch("/admin/getDostavkiLength")
    .then(async res =>{
        const subsectionJson = await res.json();
        $(".dostavki").append(`
        <span class="deliveries-count">
        ${subsectionJson}
        </span>
        `)
    }),
    fetch("/admin/getUsersLength")
    .then(async res=>{
        const usersJson = await res.json()
        $(".users").append(`
        <span class="deliveries-count">
        ${usersJson}
        </span>
        `)
    })
})
   </script>