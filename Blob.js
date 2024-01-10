/*
  Blob.js
  By Nicolino
  This library doesn't have a renderer yet.
  Blobjects are objects which have information about their particles, shapes and obstacles.
  Why are there Blobjects?
  Because you can use them to add shapes and obstacles without using different function for that.
  Shapes are objects which contain their particles and color (optional).
  They are created to say which particle belongs to which object. particles of the same shape can overlap each other.
*/
var BlobJS = {
  //World "class"
  World: function() {
    //particles
    this.particles = [];
    //shapes
    this.shapes = [];
    //obstacles
    this.obstacles = [];
    //pre-set bounds with Infinite numbers, so the world doesn't have any
    this.bounds = {
      x: -Infinity,
      y: -Infinity,
      w: Infinity,
      h: Infinity
    };
    //set the bounds of the world
    this.setBounds = function(x1, y1, x2, y2) {
      this.bounds = {
        x: x1,
        y: y1,
        w: x2 - x1,
        h: y2 - y1
      };
    };
    //reset bounds
    this.removeBounds = function() {
      this.bounds = {
        x: -Infinity,
        y: -Infinity,
        w: Infinity,
        h: Infinity
      };
    };
    //update
    this.update = function() {
      //call the update function for each particle
      for (var i = 0; i < this.particles.length; i++) {
        this.particles[i].update();
      }
    };
    //add obstacle
    this.addObstacle = function(o) {
      this.obstacles.push(o);
    };
    //add Blobject. Blobjects: see at the top of the file
    this.add = function(blobj) {
      //Check and add particles to the world
      if (blobj.particles !== undefined) {
        this.particles = this.particles.concat(blobj.particles);
      }
      //Check and add shapes to the world
      if (blobj.shapes !== undefined) {
        this.shapes = this.shapes.concat(blobj.shapes);
      }
      //Check and add obstacles to the world
      if (blobj.obstacles !== undefined) {
        this.obstacles = this.obstacles.concat(blobj.obstacles);
      }
    };
    //get all particles
    this.getParticles = function() {
      return this.particles;
    };
    //get all shapes
    this.getShapes = function() {
      return this.shapes;
    };
  },
  //Particle "class"
  Particle: function(x, y, w) {
    //w for World-"class"
    this.w = w;
    this.id = Math.random();
    this.x = x;
    this.y = y;
    //velocity
    this.v = {
      x: 0,
      y: 0
    };
    this.mass = 1;
    this.radius = 25;
    //type needed in special cases.
    this.type = "particle";
    //list for all particles in the shape which contains the distance to each particle.
    this.distanceList = [];
    //get the position of the particle
    this.getPosition = function() {
      return {
        x: this.x,
        y: this.y
      };
    };
    //get velocity
    this.getVelocity = function() {
      return {
        x: this.v.x,
        y: this.v.y
      };
    };
    //set position
    this.setPosition = function(x, y) {
      //check if not NaN
      if (!isNaN(x)) {
        this.x = x;
      }
      else {
        BlobJS.Log("Particle.setPosition: first parameter is not a number.");
      }
      //check if not NaN
      if (!isNaN(y)) {
        this.y = y;
      }
      else {
        BlobJS.Log("Particle.setPosition: second parameter is not a number.");
      }
    };
    //set velocity
    this.setVelocity = function(x, y) {
      //check if not NaN
      if (!isNaN(x)) {
        this.v.x = x;
      }
      else {
        BlobJS.Log("Particle.setVelocity: first parameter is not a number.");
      }
      //check if not NaN
      if (!isNaN(y)) {
        this.v.y = y;
      }
      else {
        BlobJS.Log("Particle.setVelocity: second parameter is not a number.");
      }
    };
    //get radius
    this.getRadius = function() {
      return this.radius;
    };
    //get mass
    this.getMass = function() {
      return this.mass;
    };
    //update
    this.update = function() {
      //move the particle. See at Particle.move
      this.move();
      //damp the velocity
      this.v.x *= 0.98;
      this.v.y *= 0.98;
      //apply gravity
      this.v.y += 0.2 * this.mass;
      //check if the particle hits the boundaries
      if (this.x - this.radius / 2 < this.w.bounds.x || this.x + this.radius / 2 > this.w.bounds.w) {
        this.v.x *= -0.9;
      }
      if (this.y - this.radius / 2 < this.w.bounds.y || this.y + this.radius / 2 > this.w.bounds.h) {
        this.v.y *= -0.9;
      }
      //make sure the particle isn't outside the boundary
      this.x = Math.min(Math.max(this.x - this.radius / 2, this.w.bounds.x) + this.radius / 2, this.w.bounds.w);
      this.y = Math.min(Math.max(this.y - this.radius / 2, this.w.bounds.y) + this.radius / 2, this.w.bounds.h);
      //check for some NaN values
      if (this.x == NaN) {
        this.x = this.w.bounds.x;
      }
      if (this.y == NaN) {
        this.y = this.w.bounds.y;
      }
      if (this.v.x == NaN) {
        this.v.x = 0;
      }
      if (this.v.y == NaN) {
        this.v.y = 0;
      }
      //loops over every particle
      var particles = this.w.particles;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        //If the particle is not the same as the particle which is being updated
        if (p !== this) {
          //get the distance between the two particles
          var d = BlobJS.getDistance(this.x, this.y, p.x, p.y);
          var l = 0;
          //check loop over the distanceList, see at declaration
          for (var j = 0; j < p.distanceList.length; j++) {
            //check if the id matches with the particle to be updated
            if (p.distanceList[j].p.id === this.id) {
              l = p.distanceList[j].d;
            }
          }
          //dx and dy are the difference between the two particles
          var dx = p.x - this.x;
          var dy = p.y - this.y;
          //if distance not 0. That also means that only apply spring force if the other particle is in the same shape.
          if (l !== 0) {
            //Hook's law
            var fc = (d - l) * this.hardness;
            var F = fc - fc / 1.15;
            //if F not NaN
            if (!isNaN(F)) {
              //apply F to the velocity
              this.v.x += (F / (1 + Math.abs(dx))) / this.mass * dx / d;
              this.v.y += (F / (1 + Math.abs(dy))) / this.mass * dy / d;
            }
          }
          //Check if the particle is from another shape
          if (d < this.radius && p.shapeid !== this.shapeid) {
            //calculate force to be pushed out from the other particle
            var am = (this.radius - d) * 16 * this.mass;
            //apply it to the position
            this.x -= (am / (1 + Math.abs(dx))) / this.mass * dx / d;
            this.y -= (am / (1 + Math.abs(dy))) / this.mass * dy / d;
            //The block of code from here
            var pf = 0.000001;
            p.v.x += (am*pf*this.mass*Math.min(1, Math.abs(this.v.x-p.v.x))/p.mass / (1 + Math.abs(dx))) / p.mass * dx / d;
            p.v.y += (am*pf*this.mass*Math.min(1, Math.abs(this.v.y-p.v.y))/p.mass / (1 + Math.abs(dy))) / p.mass * dy;
            this.v.x *= 0.5;
            this.v.y *= 0.5;
            //to here is not so good and should be improved in later versions.
          }
        }
      }
    };
    //move the particle
    this.move = function() {
      //if initialise cx and cy to check if the particle is allowed to move
      var cx = true;
      var cy = true;
      //cox and coy will be used in later versions
      var cox;
      var coy;
      //calculate new x and y position to not write so much code below
      var nx = this.x + this.v.x;
      var ny = this.y + this.v.y;
      //loop over all obstacles
      var obs = this.w.obstacles;
      for (var i = 0; i < obs.length; i++) {
        var o = obs[i];
        //BlobJS.circleInRectangle: see further down
        if (BlobJS.circleInRectangle(nx, this.y, this.radius / 2, o.x, o.y, o.w, o.h)) {
          //disallow the particle to move on the x-axis
          cx = false;
          cox = o;
        }
        if (BlobJS.circleInRectangle(this.x, ny, this.radius / 2, o.x, o.y, o.w, o.h)) {
          //disallow the particle to move on the y-axis
          cy = false;
          coy = o;
        }
      }
      //if allowed, move the particle
      if (cx) {
        this.x = nx;
      }
      else {
        //multiply velocityX by -1
        this.v.x *= -1;
      }
      //if allowed, move the particle
      if (cy) {
        this.y = ny;
      }
      else {
        //multiply velocityY by -1
        this.v.y *= -1;
      }
    };
  },
  // Shape "class"
  Shape: function(p, color) {
    //points are just the particles in the shape
    this.points = p;
    //color (optional)
    this.color = color;
    //set velocity for every particle in the shape
    this.setVelocity = function(x, y) {
      for (var i = 0; i < this.points.length; i++) {
        this.points[i].setVelocity(x, y);
      }
    };
    //get all particles in the shape
    this.getPoints = function() {
      return this.points;
    };
    //get the middle point of the shape
    this.getMiddlePoint = function() {
      //simple averaging
      var avx = 0;
      var avy = 0;
      //loop over points
      for (var i = 0; i < this.points.length; i++) {
        avx += this.points[i].x;
        avy += this.points[i].y;
      }
      avx /= this.points.length;
      avy /= this.points.length;
      return {
        x: avx,
        y: avy
      };
    };
    //get render vertices. BlobJS has no renderer, but can give the points where to render
    this.getRenderVertices = function() {
      var vertices = [];
      //get middle point. see at Shape.getMiddlePoint
      var mp = this.getMiddlePoint();
      for (var i = 0; i < this.points.length; i++) {
        var p = this.points[i];
        //for BlobJS.renderBlobPoint: see further down.
        var ps = BlobJS.renderBlobPoint(p, mp.x, mp.y);
        vertices.push({ x: ps.x, y: ps.y, radius: p.radius });
      }
      //first particle again to make the shape more round
      var p0 = this.points[0];
      //again renderBlobPoint
      var ps = BlobJS.renderBlobPoint(p0, mp.x, mp.y);
      ps.radius = p.radius;
      //push the last
      vertices.push(ps.x, ps.y);
      return vertices;
    };
  },
  //Utility functions
  cnpba: function(x, y, a, d) {
    var ra = a * (180 / Math.PI);
    return {
      x: x + Math.sin(ra) * d,
      y: y + Math.cos(ra) * d
    };
  },
  getAngle: function(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI) + 360 % 360;
  },
  //Blobject "class". For explanation, see at the document's top
  Blobject: function(params) {
    //particles, obstacles and shapes
    this.particles = params.particles;
    this.obstacles = params.obstacles;
    this.shapes = params.shapes;
    //set velocity: not necessary, but can be used to set the velocity of all particles at once
    this.setVelocity = function(x, y) {
      for (var i = 0; i < this.particles.length; i++) {
        this.particles[i].setVelocity(x, y);
      }
    };
  },
  /*calculate the actual point to render the particle, because the particles x and y position
  is in the middle of the particles range, but that would look werid. The blobs would "float" on each other*/
  renderBlobPoint: function(p, avx, avy) {
    //dx and dy are the difference between the two particles
    var dx = p.x - avx;
    var dy = p.y - avy;
    //get distance: just calculating the distance between the two particles
    var ds = BlobJS.getDistance(avx, avy, p.x, p.y);
    var rd = p.radius / 2;
    // apply rd
    var psx = p.x + ((rd * dx) / ds);
    var psy = p.y + ((rd * dy) / ds);
    return {
      x: psx,
      y: psy
    };
  },
  //utility function to move a point towards/away from the other
  moveToOther: function(f, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var ds = BlobJS.getDistance(x1, y1, x2, y2);
    return {
      x: x1.x + ((f * dx+1) / ds),
      y: y1.y + ((f * dy+1) / ds)
    };
  },
  //shape templates
  templates: {
    //a circle with these parameters: x, y, radius, distance, distX, distY, world, color, mass, hardness
    createBlob: function(params) {
      //particle array
      var np = [];
      //shape id: random
      var si = Math.random();
      //make the circle
      for (var a = 0; a < params.points; a += 1) {
        //BlobJS.cnpba: see further up
        var pos = BlobJS.cnpba(params.x, params.y, a * (360 / params.points), params.radius);
        //create the particle
        var p = new BlobJS.Particle(pos.x, pos.y, world);
        //apply parameters
        p.mass = params.mass;
        p.hardness = params.hardness;
        p.shapeid = si;
        np.push(p);
      }
      //make a connection from each to each particle
      for (var i = 0; i < np.length; i++) {
        var p = np[i];
        for (var j = 0; j < np.length; j++) {
          if (i !== j) {
            //Particle.distanceList: see further up, at the initialising of BlobJS.Particle
            p.distanceList.push(
              {
                p: np[j],
                d: BlobJS.getDistance(p.x, p.y, np[j].x, np[j].y)
              }
            );
          }
        }
      }
      return new BlobJS.Blobject(
        {
          particles: np,
          shapes: new BlobJS.Shape(np, params.color)
        }
      );
    },
    //a rectangle with these parameters: x, y, width, height, distX, distY, world, color, mass, hardness
    createRect: function(params) {
      //particle array
      var np = [];
      //random shape id
      var si = Math.random();
      //utility function to make a particle at position
      function at(x, y) {
        var p = new BlobJS.Particle(x, y, world);
        p.mass = params.mass;
        p.hardness = params.hardness;
        p.shapeid = si;
        np.push(p);
      }
      //spaghetti code to make the rectangle.
      //Why is it ordered like that?
      //if you render it without that special order, the rectangle will look like a werid, round grid
      for (var x = 0; x < params.width; x += 1) {
        at(params.x + x * params.distX, params.y);
      }
      for (var y = 0; y < params.height; y += 1) {
        at(params.x + params.width * params.distX, params.y + y * params.distY);
      }
      for (var x = params.width - 1; x >= 0; x -= 1) {
        at(params.x + x * params.distX, params.y + params.height * params.distY);
      }
      for (var y = params.height - 1; y >= 0; y -= 1) {
        at(params.x, params.y + y * params.distY);
      }
      //connect each particle to each other
      for (var i = 0; i < np.length; i++) {
        var p = np[i];
        for (var j = 0; j < np.length; j++) {
          if (i !== j) {
            //Particle.distanceList: see further up, at the initialising of BlobJS.Particle
            p.distanceList.push(
              {
                p: np[j],
                d: BlobJS.getDistance(p.x, p.y, np[j].x, np[j].y)
              }
            );
          }
        }
      }
      //Blobjects: see at the document's top
      return new BlobJS.Blobject(
        {
          particles: np,
          shapes: [new BlobJS.Shape(np, params.color)]
        }
      );
    },
    //obstacles are rectangles with no rotation
    Obstacle: function(x, y, w, h) {
      //Blobject
      return new BlobJS.Blobject(
        {
          particles: [],
          shapes: [],
          obstacles: [{ x: x, y: y, w: w, h: h }]
        }
      );
    }
  },
  //utility function to get the distance
  getDistance: function(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  //calculate to check if a circle is in a tringale
  circleInRectangle: function(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
    const distanceX = circleX - closestX;
    const distanceY = circleY - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    return distanceSquared < (circleRadius * circleRadius);
  },
  //log something
  Log: function(t) {
    console.log("BlobJS:\n" + t);
  }
};
