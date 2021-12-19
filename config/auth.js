exports.isUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Por favor, inicia sesión.');
        res.redirect('/users/login');
    }
}

exports.isAdmin = function(req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin == 1) {
        next();
    } else {
        req.flash('danger', 'Por favor, inicie sesión como administrador.');
        res.redirect('/users/login');
    }
}


