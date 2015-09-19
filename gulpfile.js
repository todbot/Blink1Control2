"use strict";

var gulp = require('gulp');
var connect = require('gulp-connect'); //Runs a local dev server
//var open = require('gulp-open'); //Open a URL in a web browser
var browserify = require('browserify'); // Bundles JS
var reactify = require('reactify');  // Transforms React JSX to JS
var source = require('vinyl-source-stream'); // Use conventional text streams with Gulp
var concat = require('gulp-concat'); //Concatenates files
var lint = require('gulp-eslint'); //Lint JS files, including JSX
var electron = require('electron-connect').server.create();

var config = {
	port: 9005,
	devBaseUrl: 'http://localhost',
	paths: {
		html: './src/*.html',
		js: './src/**/*.js',
		images: './src/images/*',
		css: [
      		'node_modules/bootstrap/dist/css/bootstrap.min.css',
      		'node_modules/bootstrap/dist/css/bootstrap-theme.min.css',
      		'node_modules/toastr/build/toastr.css',
      		'node_modules/font-awesome/css/font-awesome.min.css'
    	],
    	fonts: [
    		'node_modules/bootstrap/dist/fonts/*',
    		'node_modules/font-awesome/fonts/*'
    	],
		dist: './dist',
		mainJs: './src/maingui.js'
	}
};

//Start a local development server
gulp.task('connect', function() {
	//connect.server({
	//	root: ['dist'],
	//	port: config.port,
	//	base: config.devBaseUrl,
	//	livereload: true
	//});
});

gulp.task('open', ['connect'], function() {
	gulp.src('dist/index.html')
		.pipe(open('', { url: config.devBaseUrl + ':' + config.port + '/'}));
});

gulp.task('html', function() {
	gulp.src(config.paths.html)
		.pipe(gulp.dest(config.paths.dist))
		.pipe(connect.reload());
});

gulp.task('js', function() {
	browserify(config.paths.mainJs)
		.transform(reactify)
		.bundle()
		.on('error', console.error.bind(console))
		.pipe(source('bundle.js'))
		.pipe(gulp.dest(config.paths.dist + '/scripts'));
		//.pipe(connect.reload());
});

gulp.task('css', function() {
	gulp.src(config.paths.css)
		.pipe(concat('bundle.css'))
		.pipe(gulp.dest(config.paths.dist + '/css'));
});

gulp.task('images', function() {
	gulp.src(config.paths.images)
		.pipe(gulp.dest(config.paths.dist + '/images'))
		.pipe(connect.reload());
	//publish favicon
	gulp.src('./src/favicon.ico')
		.pipe(gulp.dest(config.paths.dist));
});

gulp.task('fonts', function() {
	gulp.src(config.paths.fonts)
		.pipe(gulp.dest(config.paths.dist + '/fonts'))
		.pipe(connect.reload());
});

gulp.task('lint', function() {
	return gulp.src(config.paths.js)
		.pipe(lint({config: 'eslint.config.json'}))
		.pipe(lint.format());
});

gulp.task('watch', function() {
	gulp.watch(config.paths.html, ['html']);
	gulp.watch(config.paths.js, ['js', 'lint']);
});

gulp.task('electron-simple', function() {
	electron.start();
});
gulp.task('electron-reload', function() {
	electron.reload();
});

gulp.task('serve', function() {
 // Start browser process
  electron.start();

  // Restart browser process
  //gulp.watch('app.js', electron.restart);
  // Reload renderer process
  //gulp.watch(['index.js', 'index.html'], electron.reload);
  //gulp.watch(config.paths.html, ['html','electron-reload']);
  gulp.watch(config.paths.js, ['js', 'lint', electron.reload]); //'electron-reload']);
});

//gulp.task('default', ['html', 'js', 'images', 'css', 'fonts', 'lint', 'connect', 'watch']);
//gulp.task('default', ['html', 'js', 'images', 'css', 'fonts', 'lint', 'electron', 'watch']);
gulp.task('default', ['html', 'js', 'images', 'css', 'fonts', 'lint', 'serve']);
