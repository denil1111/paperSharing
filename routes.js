/**
 * Module dependencies.
 */
var parse = require('co-body');
var fileParse = require('co-busboy');
var render = require('./lib/render');
var fs = require('fs');
var path = require('path');
var bibParse = require('bibtex-parser-js');

// Set up monk
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/koaBlog');

// Wrap monk in generator goodness
var papers = wrap(db.get('papers'));

// And now... the route definitions
/**
 * paper listing.
 */
module.exports.list = function *list() {
  var paperList = yield papers.find({});

  this.body = yield render('list', { papers: paperList , itemPerPage : 10});
};

/**
 * Show creation form.
 */
module.exports.add = function *add() {
  this.body = yield render('new');
};

/**
 * Show paper :id.
 */
module.exports.show = function *show(id) {
  var paper = yield papers.findOne({_id:id});
  if (!paper) this.throw(404, 'invalid paper id');
  this.body = yield render('show', { paper: paper });
};

/**
 * Create a paper.
 */
module.exports.create = function *create() {
  // console.log("Create");
  var parts = fileParse(this);
  var form = {};
  var filename = "";
  console.log(parts);
  while (part =
      yield parts) {
      console.log("find");
      if (part.length) { // <--- I suspect this is to blame
          // arrays are busboy fields 
          console.log('key: ' + part[0])
          console.log('value: ' + part[1])
          form[part[0]] = part[1];
      } else {
          // otherwise, it's a stream 
          console.log('stream');
          filename = Math.random().toString() + path.extname(part.filename);
          var stream = fs.createWriteStream(path.join('paper/', filename));
          part.pipe(stream);
          console.log('uploading %s -> %s', part.filename, stream.path);
      }
  }
  var bib = bibParse.toJSON(form.bib)[0];
  console.log(bib);
  paper = form;
  paper.title = bib.entryTags.TITLE;
  paper.key = bib.citationKey;
  paper.type = bib.entryType;
  paper.tag = bib.entryTags;
  paper.path = path.join('paper/', filename);
  yield papers.insert(paper);
  this.redirect('/');
};

// /**
//  * Show edit form
//  */
// module.exports.edit = function *edit(id) {
//   var paper = yield papers.findOne({_id:id});
//   this.body = yield render('edit', { paper: paper });
// };

// /**
//  * Update paper
//  */
// module.exports.update = function *update(id) {
//   var paper = yield parse(this);
//   yield papers.updateById(id, paper);
//   this.redirect('/paper/' + id);
// };

/**
 * Remove paper
 */
module.exports.remove = function *remove(id) {
  var paper = yield papers.findOne({_id:id});
  fs.unlink(paper.path);
  yield papers.remove({_id:id});
  this.redirect('/');
};

/**
 * fileDownload
 */
function stat(file) {
  return function (done) {
    fs.stat(file, done);
  };
}
module.exports.download = function *download(id) {
  var paper = yield papers.findOne({_id:id});
  console.log(paper);
  var dPath = path.join(__dirname , paper.path);
  var fstat = yield stat(dPath);

  if (fstat.isFile()) {
    this.body = fs.createReadStream(dPath);
  }
  this.set('Content-disposition', 'attachment; filename=' + paper.title + path.extname(dPath));
  this.set('Content-type', path.extname(dPath));
}

/**
 * search
 */
module.exports.search = function *search() {
  var key = yield parse(this);
  var info = {
  };
  console.log(key);
  if (key.title) {
    info.title = { $regex: key.title, $options: 'i'};
  }
  if (key.author) {
    info["tag.AUTHOR"] = { $regex : key.author, $options: 'i'};
  }
  if (key.journal) {
    info["tag.JOURNAL"] = { $regex : key.journal, $options: 'i'};
  }
  var paperList = yield papers.find( info
  );
  this.body = yield render('list', { papers: paperList , itemPerPage : 10});   
}