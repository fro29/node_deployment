$(function(){

    if($('textarea#ta').length){
        CKEDITOR.replace('ta');
    }
    $('a.confirmDeletion').on('click',function(e){
        if (!confirm('Confirmar eliminación')) return false;

    });
    
    if ($("[data-fancybox]").length) {
        $("[data-fancybox]").fancybox();
    }
});


