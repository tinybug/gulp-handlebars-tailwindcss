// From: https://github.com/manjumjn/gulp-with-tailwindcss

const { src, dest, task, watch, series, parallel } = require("gulp");
const browserSync = require("browser-sync").create();
const sass = require("gulp-sass"); //For Compiling SASS files
const concat = require("gulp-concat"); //For Concatinating js,css files
const postcss = require("gulp-postcss"); //For Compiling tailwind utilities with tailwind config
const uglify = require("gulp-uglify"); //To Minify JS files
const imagemin = require("gulp-imagemin"); //To Optimize Images
const purgecss = require("gulp-purgecss"); //To Remove Unsued CSS
const cleanCSS = require("gulp-clean-css"); //To Minify CSS files
//Note : Webp still not supported in majpr browsers including forefox
//const webp = require('gulp-webp'); //For converting images to WebP format
//const replace = require('gulp-replace'); //For Replacing img formats to webp in html
const del = require("del"); //For Cleaning build/dist for fresh export
const logSymbols = require("log-symbols"); //For Symbolic Console logs :) :P
const handlebars = require("gulp-compile-handlebars");
const rename = require("gulp-rename");

const options = {
  config: {
    tailwindjs: "./tailwind.config.js",
  },
  paths: {
    root: "./",
    src: {
      base: "./src",
      pages: "./src/pages",
      partials: "./src/partials",
      css: "./src/assets/css",
      js: "./src/assets/js",
      img: "./src/assets/img",
    },
    dist: {
      base: "./dist",
      css: "./dist/assets/css",
      js: "./dist/assets/js",
      img: "./dist/assets/img",
    },
    build: {
      base: "./build",
      css: "./build/assets/css",
      js: "./build/assets/js",
      img: "./build/assets/img",
    },
  },
};

const TailwindExtractor = (content) => {
  return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
};

//Load Previews on Browser on dev
task("livepreview", (done) => {
  browserSync.init({
    server: {
      baseDir: options.paths.dist.base,
    },
    port: 1234,
  });
  done();
});

//Reload functions which triggers browser reload
function previewReload(done) {
  console.log("\n\t" + logSymbols.info, "Reloading Preview.\n");
  browserSync.reload();
  done();
}

task("dev-html", () => {
  return (
    src(options.paths.src.pages + "/**/*.hbs")
      .pipe(
        handlebars(
          {},
          {
            ignorePartials: true,
            batch: [options.paths.src.partials],
          }
        )
      )
      .pipe(
        rename({
          extname: ".html",
        })
      )
      //Note : Webp still not supported in majpr browsers including forefox
      //.pipe(replace('.jpg', '.webp'))
      //.pipe(replace('.png', '.webp'))
      //.pipe(replace('.jpeg','.webp'))
      .pipe(dest(options.paths.dist.base))
  );
});

task("build-html", () => {
  return (
    src(options.paths.src.pages + "/**/*.hbs")
      .pipe(
        handlebars(
          {},
          {
            ignorePartials: true,
            batch: [options.paths.src.partials],
          }
        )
      )
      .pipe(
        rename({
          extname: ".html",
        })
      )
      //Note : Webp still not supported in majpr browsers including forefox
      //.pipe(replace('.jpg', '.webp'))
      //.pipe(replace('.png', '.webp'))
      //.pipe(replace('.jpeg','.webp'))
      .pipe(dest(options.paths.build.base))
  );
});

//Compiling styles
task("dev-styles", () => {
  var tailwindcss = require("tailwindcss");
  return src(options.paths.src.css + "/**/*")
    .pipe(sass().on("error", sass.logError))
    .pipe(
      postcss([tailwindcss(options.config.tailwindjs), require("autoprefixer")])
    )
    .pipe(concat({ path: "style.css" }))
    .pipe(dest(options.paths.dist.css));
});

//Compiling styles
task("build-styles", () => {
  return src(options.paths.dist.css + "/**/*")
    .pipe(
      purgecss({
        content: ["src/**/*.html", "src/**/.*js"],
        extractors: [
          {
            extractor: TailwindExtractor,
            extensions: ["html"],
          },
        ],
      })
    )
    .pipe(cleanCSS({ compatibility: "ie8" }))
    .pipe(dest(options.paths.build.css));
});

//merging all script files to a single file
task("dev-scripts", () => {
  return src([
    options.paths.src.js + "/**/*.js",
  ])
    .pipe(concat({ path: "scripts.js" }))
    .pipe(dest(options.paths.dist.js));
});

//merging all script files to a single file
task("build-scripts", () => {
  return src([
    options.paths.src.js + "/**/*.js",
  ])
    .pipe(concat({ path: "scripts.js" }))
    .pipe(uglify())
    .pipe(dest(options.paths.build.js));
});

task("dev-imgs", (done) => {
  src(options.paths.src.img + "/**/*")
    //Note : Webp still not supported in majpr browsers including forefox
    //.pipe(webp({ quality: 100 }))
    .pipe(dest(options.paths.dist.img));
  done();
});

task("build-imgs", (done) => {
  src(options.paths.src.img + "/**/*")
    //Note : Webp still not supported in majpr browsers including forefox
    //.pipe(webp({ quality: 100 }))
    .pipe(imagemin())
    .pipe(dest(options.paths.build.img));
  done();
});

//Watch files for changes
task("watch-changes", (done) => {
  //Watching HTML Files edits
  watch(options.config.tailwindjs, series("dev-styles", previewReload));

  //Watching HTML Files edits
  watch(
    options.paths.src.base + "/**/*.hbs",
    series("dev-styles", "dev-html", previewReload)
  );

  //Watching css Files edits
  watch(options.paths.src.css + "/**/*", series("dev-styles", previewReload));

  //Watching JS Files edits
  watch(
    options.paths.src.js + "/**/*.js",
    series("dev-scripts", previewReload)
  );

  //Watching Img Files updates
  watch(options.paths.src.img + "/**/*", series("dev-imgs", previewReload));

  console.log(
    "\n\t" + logSymbols.info,
    "Watching for Changes made to files.\n"
  );

  done();
});

//Cleaning dist folder for fresh start
task("clean:dist", () => {
  console.log(
    "\n\t" + logSymbols.info,
    "Cleaning dist folder for fresh start.\n"
  );
  return del(["dist"]);
});

//Cleaning build folder for fresh start
task("clean:build", () => {
  console.log(
    "\n\t" + logSymbols.info,
    "Cleaning build folder for fresh start.\n"
  );
  return del(["build"]);
});

//series of tasks to run on dev command
task(
  "development",
  series(
    "clean:dist",
    "dev-html",
    "dev-styles",
    "dev-scripts",
    "dev-imgs",
    (done) => {
      console.log(
        "\n\t" + logSymbols.info,
        "npm run dev is complete. Files are located at ./dist\n"
      );
      done();
    }
  )
);

task(
  "optamizedBuild",
  series(
    "clean:build",
    "build-html",
    "dev-styles",
    "build-styles",
    "build-scripts",
    "build-imgs",
    (done) => {
      console.log(
        "\n\t" + logSymbols.info,
        "npm run build is complete. Files are located at ./build\n"
      );
      done();
    }
  )
);

exports.default = series("development", "livepreview", "watch-changes");
exports.build = series("optamizedBuild");
