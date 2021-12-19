var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get pagina model
var Page = require('../models/page');


/*
 *GET pagina index
 */
router.get('/', isAdmin ,function(req,res){
    Page.find({}).sort({sorting: 1}).exec(function(err,pages){
        res.render('admin/pages',{
            pages:pages
        });
    });
});

/*
 *GET agregar pagina
 */
 router.get('/add-page', isAdmin ,function(req,res){
    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page',{
        title: title,
        slug: slug,
        content: content
    });
});

/*
 *POST agregar pagina
 */
    router.post('/add-page',function(req,res){
    
    req.checkBody('title','El título debe tener un nombre.').notEmpty();
    req.checkBody('content','El contenido esta vacio.').notEmpty();

    
    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if(slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    
    var errors = req.validationErrors();
    
    if(errors){ 
        res.render('admin/add_page',{
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    }else{
     Page.findOne({slug: slug},function(err,page){
         if(page){
             req.flash('danger','El slug de la página existe, elija otro.');
             res.render('admin/add_page',{
                title: title,
                slug: slug,
                content: content
            });
         }else{
             var page = new Page({
                 title: title,
                 slug : slug,
                 content : content,
                 sorting: 100
             });
             page.save(function(){
                 if(err) return console.log(err);
                 
                 Page.find({}).sort({sorting: 1}).exec(function(err, pages){
                    if(err){
                        console.log(err);
                    }else{
                        req.app.locals.pages = pages;
                    }
                  });

                 req.flash('success','Página editada!');
                 res.redirect('/admin/pages');
             });
         }  
     });
    }
});

//Sort funcion pagina 
function sortPages(ids, callback){
    var count = 0;

    for(var i = 0;i<ids.length;i++){
        var id = ids[i];
        count++;
 
       (function(count){
        Page.findById(id, function(err,page){
            page.sorting = count;
            page.save(function(err){
                if (err)
                return console.log(err);
                ++count;
                if (count >= id.length){
                    callback();
                }
            });
        });
     })(count);
    } 
}



/*
 *POST reorden paginas index
 */
 router.post('/reorder-pages',function(req,res){
   var ids = req.body['id[]'];
   
   sortPages(ids,function(){
    Page.find({}).sort({sorting: 1}).exec(function(err, pages){
        if(err){
            console.log(err);
        }else{
            req.app.locals.pages = pages;
        }
      });
   });
});

/*
 *GET editar paginas
 */
 router.get('/edit-page/:id',isAdmin ,function(req,res){
    
    Page.findById(req.params.id,function(err,page){
        if (err) return console.log(err);
            res.render('admin/edit_page',{
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        });
    });
});

/*
 *POST editar pagina
 */
 router.post('/edit-page/:id', function (req, res){
    
    req.checkBody('title','El título debe tener un nombre.').notEmpty();
    req.checkBody('content','El contenido esta vacio').notEmpty();

    
    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if(slug == "") 
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;
    
    var errors = req.validationErrors();
    
    if(errors){ 
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
    }else{
     Page.findOne({slug: slug, _id:{'$ne':id}},function(err,page){
         if(page){
             req.flash('danger','El slug de la página ya existe, elija otro.');
             res.render('admin/edit_page',{
                title: title,
                slug: slug,
                content: content,
                id: id
            });
         }else{
             Page.findById(id,function(err,page){
                 if(err) return console.log(err);

                 page.title = title;
                 page.slug = slug;
                 page.content = content;
                 page.save(function(err){
                   if(err) 
                   return console.log(err);

                   Page.find({}).sort({sorting: 1}).exec(function(err, pages){
                    if(err){
                        console.log(err);
                    }else{
                        req.app.locals.pages = pages;
                    }
                  });
                  
                   req.flash('success','Página editada!');
                   res.redirect('/admin/pages/edit-page/'+id);
                  });           
                });
         }
     });
    }
});

/*
 *GET elimanar pagina
 */
 router.get('/delete-page/:id', isAdmin ,function(req,res){
    Page.findByIdAndRemove(req.params.id,function(err){
        if(err) 
        return console.log(err);

        Page.find({}).sort({sorting: 1}).exec(function(err, pages){
            if(err){
                console.log(err);
            }else{
                req.app.locals.pages = pages;
            }
          });

         req.flash('success','Página eliminada!');
         res.redirect('/admin/pages/');
    });
});

// Exports
module.exports = router;
