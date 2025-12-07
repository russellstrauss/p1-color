const gulp = require('gulp');
const dartSass = require('sass');
const gulpSass = require('gulp-sass');
const sass = gulpSass(dartSass);
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('browserify');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const notifier = require('node-notifier');
const esmify = require('esmify');

// Sass compilation task
function compileSass() {
	return gulp.src('./assets/sass/main.scss')
		.pipe(sourcemaps.init())
		.pipe(sass.sync({ silenceDeprecations: ['legacy-js-api'] }).on('error', sass.logError))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./assets/sass'))
		.pipe(browserSync.stream());
}

// Browser-sync server task
function serve(done) {
	browserSync.init({
		open: true,
		server: {
			baseDir: "./",
		}
	});
	done();
}

// Vendors concatenation task
const vendors = {
	merge: [
		//'./assets/vendors/js/three.js'
	]
};

function buildVendors(done) {
	if (vendors.merge.length === 0) {
		done();
		return;
	}
	return gulp.src(vendors.merge, { allowEmpty: true })
		.pipe(concat('vendors.js'))
		.pipe(gulp.dest('./assets/vendors/js/'));
}

// JavaScript bundling with Browserify and Babel
function javascript() {
	return browserify('./assets/js/main.js')
		.plugin(esmify)
		.transform("babelify", { presets: ["@babel/preset-env"] })
		.bundle()
		.on('error', function(err) {
			console.log(err.stack);
			notifier.notify({
				'title': 'Browserify Compilation Error',
				'message': err.message
			});
			this.emit('end');
		})
		.pipe(source('main.js'))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('./assets/js/'))
		.pipe(browserSync.stream());
}

// HTML reload task
function html() {
	return gulp.src(['./index.html'])
		.pipe(browserSync.stream());
}

// Watch task
function watchFiles() {
	gulp.watch('./assets/sass/**/*.scss', compileSass);
	gulp.watch(['./assets/js/**/*.js', '!./assets/js/bundle.js'], javascript);
	gulp.watch('./**/*.html', html);
}

// Build task (without watch/serve)
const build = gulp.parallel(buildVendors, javascript, compileSass);

// Default task
const defaultTask = gulp.series(
	build,
	gulp.parallel(watchFiles, serve)
);

// Export tasks
exports.sass = compileSass;
exports.vendors = buildVendors;
exports.javascript = javascript;
exports.html = html;
exports.watch = watchFiles;
exports.serve = serve;
exports.build = build;
exports.default = defaultTask;
