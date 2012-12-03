void setup() {
  size(600,600);
}

void draw() {
  stroke(random(255));
  line(random(width), random(height), random(width), random(height)); 
}
