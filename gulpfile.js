'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var concat = require('gulp-concat');
var buildDir = 'www';
var devDir = 'dev';

gulp.task('sass', function () {
    gulp.src(devDir + '/sass/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(concat('build.css'))
        .pipe(gulp.dest(buildDir + '/css'));
});

gulp.task('moveJSLibs', function () {
    gulp.src([
            'bower_components/jquery/dist/jquery.min.js'
        ])
        .pipe(concat('libs.js'))
        .pipe(gulp.dest(buildDir + '/js'));
});

gulp.task('moveCSSLibs', function () {
    gulp.src([

        ])
        .pipe(concat('libs.css'))
        .pipe(gulp.dest(buildDir + '/css'));
});

gulp.task('moveJS', function () {
    gulp.src(devDir + '/js/**/*.js')
        .pipe(concat('build.js'))
        .pipe(gulp.dest(buildDir + '/js'));
});

gulp.task('moveImg', function () {
    gulp.src(devDir + '/img/**/*')
        .pipe(gulp.dest(buildDir + '/img'));
});

gulp.task('jade', function() {
    gulp.src(devDir + '/jade/**/*.jade')
        .pipe(jade({
            //pretty: true,
        }))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build', ['moveJSLibs', 'moveCSSLibs', 'moveJS', 'moveImg','sass', 'jade']);

gulp.task('watch', function () {
    gulp.watch(devDir + '/sass/**/*.scss', ['sass']);
    gulp.watch(devDir + '/js/**/*.js', ['moveJS']);
    gulp.watch(devDir + '/img/**/*', ['moveImg']);
    gulp.watch(devDir + '/jade/**/*.jade', ['jade']);
});