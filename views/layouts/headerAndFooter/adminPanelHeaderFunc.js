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
    })
   
})
   </script>