var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

//Get Producto model
var Product = require('../models/product');

// Get Categoria model
var Category = require('../models/category');


/*
 *GET productos index
 */
router.get('/', isAdmin ,function(req,res){
    var count;

    Product.count(function(err,c){
        count = c;
    });
    Product.find(function(err,products){
        res.render('admin/products',{
            products: products,
            count: count
        });
    });
});

/*
 *GET agregar producto
 */
 router.get('/add-product', isAdmin ,function(req, res){

    var title = "";
    var desc = "";
    var price = "";

    Category.find(function (err, categories) {
        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });
});

/*
 * POST agregar producto
 */
router.post('/add-product', function (req, res) {

     //var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
   // let imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
      //let imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
  /*let imageFile = ""
      if (req.files && typeof req.files.image !== "undefined"){
        imageFile = req.files.image.name;    
    }*/
    if(!req.files){imageFile =""; }
    if(req.files){
    var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
    }

    req.checkBody('title', 'El título debe tener un nombre.').notEmpty();
    req.checkBody('desc', 'La descripción esta vacía.').notEmpty();
    req.checkBody('price', 'Agregue un precio.').isDecimal();
    req.checkBody('image', 'Solo se permite subir imagenes').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    } else {
        Product.findOne({slug: slug}, function (err, product) {
            if (product) {
                req.flash('danger', 'El título del Producto ya existe, elija otro.');
                Category.find(function (err, categories) {
                    res.render('admin/add_product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    });
                });
            } else {

                var price2 = parseFloat(price).toFixed(2);

                var product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                });

                product.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/product_images/' + product._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/product_images/' + product._id + '/' + imageFile;

                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', '¡Producto agregado!');
                    res.redirect('/admin/products');
                });
            }
        });
    }
});


/*
 *GET editar producto
 */

 router.get('/edit-product/:id', isAdmin , function (req, res) {   
   
    var errors;
    
    if (req.session.errors) 
    errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {
       
       
       Product.findById(req.params.id,function(err,p){
             if(err){
                 console.log(err);
                 res.redirect('/admin/products');
             }else{
                 var galleryDir = 'public/product_images/' + p._id + '/gallery';
                 var galleryImages = null;

                 fs.readdir(galleryDir, function (err, files){
                     
                     if(err){
                         console.log(err);
                     }else{
                         galleryImages = files;
                         res.render('admin/edit_product', {
                              title: p.title,
                              errors: errors,
                              desc: p.desc,
                              categories: categories,
                              category: p.category.replace(/\s+/g, '-').toLowerCase(),
                              price: parseFloat(p.price).toFixed(2),
                              image: p.image,
                              galleryImages: galleryImages,
                              id: p._id
                   });
                 }
              });
            }
       });      
    });
});

/*
 *POST editar producto
 */
 router.post('/edit-product/:id', function (req, res){
    if(!req.files){imageFile =""; }
    if(req.files){
    var imageFile = typeof(req.files.image) !== "undefined" ? req.files.image.name : "";
    }

    req.checkBody('title', 'El título debe tener un nombre.').notEmpty();
    req.checkBody('desc', 'La descripción esta vacía.').notEmpty();
    req.checkBody('price', 'Agregue un precio.').isDecimal();
    req.checkBody('image', 'Solo se permite subir imagenes').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();
    
    if(errors){
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/' + id);
    }else{
        Product.findOne({slug: slug, _id:{'$ne':id}},function(err,p){
            if (err) 
            console.log(err);

            if(p){
                req.flash('danger','El título del Producto ya existe, elija otro.');
                res.redirect('/admin/products/edit-product/' + id);
            }else{
                Product.findById(id, function(err,p){
                    if (err) 
                    console.log(err);
                    
                    p.title = title;
                    p.session = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;

                    if(imageFile !=""){
                        p.image = imageFile;
                    }
                    p.save(function(err){
                        if(err)
                        console.log(err);

                        if (imageFile != ""){
                            if(pimage != ""){
                                fs.remove('public/product_images/'+ id +'/'+ pimage, function(err){
                                    if(err)
                                         console.log(err);
                                });
                            }
                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                            return console.log(err);
                          });
                        }
                        req.flash('success', '¡Producto editado!');
                        res.redirect('/admin/products/edit-product/' + id);
                    });
                });
            }
        });
    }
});

/*
 *POST producto galleria
 */
 router.post('/product-gallery/:id',function(req,res){
     var productImage = req.files.file;
     var id = req.params.id;
     var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
     var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

     productImage.mv(path,function(err){
         if (err)
         console.log(err);

         resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {  
             fs.writeFileSync(thumbsPath,buf);
         });
     });

     res.sendStatus(200);

});

/*
 *GET eliminar imagen
 */
 router.get('/delete-image/:image', isAdmin ,function(req,res){

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

     fs.remove(originalImage, function(err){
         if(err){
         console.log(err);
        }else {
           fs.remove(thumbImage, function(err){
            if(err){
                console.log(err);
               }else{
                req.flash('success', '¡Imagén eliminada!');
                res.redirect('/admin/products/edit-product/' + req.query.id);
               }
           });   
        }
     });
});

/*
 *GET delete producto
 */
 router.get('/delete-product/:id',function(req,res){

    var id = req.params.id;
    var path = 'public/product_images/' + id; 
    
    fs.remove(path,function(err){
        if (err){
         console.log(err);   
        }else{
            Product.findByIdAndRemove(id,function(err){
                console.log(err);
            });

            req.flash('success', '¡Producto eliminado!');
            res.redirect('/admin/products');
        }
    });
});

// Exports
module.exports = router;
