var express = require('express');
var router = express.Router();
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get Categoria modelo
var Category = require('../models/category');

/*
 *GET categoria index
 */
router.get('/', isAdmin ,function(req,res){
    Category.find(function(err,categories){
        if (err) return console.log(err);
        res.render('admin/categories',{
            categories: categories
        });
    });
});

/*
 *GET agregar categoría
 */
 router.get('/add-category', isAdmin ,function(req,res){
    var title = "";
    res.render('admin/add_category',{
        title: title
    });
});

/*
 *POST agregar categoria
 */
    router.post('/add-category',function(req,res){
    
    req.checkBody('title','Debes de agregar un nombre.').notEmpty();
    
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
   
    var errors = req.validationErrors();
    
    if(errors){ 
        res.render('admin/add_category',{
            errors: errors,
            title: title
        });
    }else{
     Category.findOne({slug: slug},function(err,category){
         if(category){
             req.flash('danger','El título de la categoría ya existe, elige otro.');
             res.render('admin/add_category',{
                title: title
            });
         }else{
             var category = new Category({
                 title: title,
                 slug : slug
             });
             category.save(function(){
                 if(err) 
                 return console.log(err);

                 Category.find(function(err, categories){
                    if(err){
                        console.log(err);
                    }else{
                        req.app.locals.categories = categories;
                    }
                });
                 
                 req.flash('success','Categoría agregada!');
                 res.redirect('/admin/categories');
             });
         }
  
     });
    }
});


/*
 *GET editar categoria
 */
 router.get('/edit-category/:id', isAdmin ,function(req,res){
    
    Category.findById(req.params.id, function(err,category){
        if (err) 
        return console.log(err);
        
        res.render('admin/edit_category',{
            title: category.title,
            id: category._id
        });
    });
});

/*
 *POST editar categoría
 */
 router.post('/edit-category/:id', function (req, res){
    
    req.checkBody('title','El título esta vacio.').notEmpty();
    

    
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;
    
    var errors = req.validationErrors();
    
    if(errors){ 
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        });
    }else{
     Category.findOne({slug: slug, _id:{'$ne':id}},function(err,category){
         if(category){
             req.flash('danger','El título de la categoría existe, elige otro.');
             res.render('admin/edit_category',{
                title: title,
                id: id
            });
         }else{
             Category.findById(id,function(err,category){
                 if(err) 
                 return console.log(err);

                 category.title = title;
                 category.slug = slug;
                 
                 category.save(function(err){
                   if(err) 
                   return console.log(err);

                   Category.find(function(err, categories){
                    if(err){
                        console.log(err);
                    }else{
                        req.app.locals.categories = categories;
                    }
                });

                   req.flash('success','Categoría editada!');
                   res.redirect('/admin/categories/edit-category/' + id);
                  });           
                });
         }
     });
    }
});

/*
 *GET eliminar categoría
 */
 router.get('/delete-category/:id', isAdmin ,function(req,res){
    Category.findByIdAndRemove(req.params.id,function(err){
        if(err) 
        return console.log(err);

        Category.find(function(err, categories){
            if(err){
                console.log(err);
            }else{
                req.app.locals.categories = categories;
            }
        });

         req.flash('success','Categoría eliminada');
         res.redirect('/admin/Categories/');
    });
});

// Exports
module.exports = router;
