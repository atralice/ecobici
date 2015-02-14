
var color = d3.scale.quantize()
  .domain([0, 9000]) //Arreglar para que calcule el rango este y no este hardcodeado
  .range(d3.range(5).map(function(d) { return "q" + d + "-3"; }));

var width = 1200, height = 525;
var t = [-985920.143529706,-513714.48739570886];
var s = 2055.1798;
//Creo la proyeccion mercator con centro en el centroide de shape de Abila con d3.geo.centroid(json)
var projection = d3.geo.mercator().center([-58.416132, -34.585615]);
var path = d3.geo.path().projection(projection).pointRadius(3/s);
var zoom = d3.behavior.zoom().translate(t).scale(s);

svg = d3.select("#map").append("svg")
	.attr("width", width)
	.attr("height", height)
	.call(zoom.on("zoom", redraw))
	.append("g")
	.attr("name","Buenos Aires")
	.attr("transform","translate("+t+")scale("+s+")")
	.style("stroke-width", 1/s);

function redraw() {
	var s = d3.event.scale;
	var t = d3.event.translate;

	svg.style("stroke-width", 1/s).attr("transform", "translate(" + t + ")scale(" + s + ")");
}
function drawMap(error, barrios, calles, estaciones, lineas) {
	
	svg.append("path")
		.datum({type: "FeatureCollection", features: topojson.feature(barrios, barrios.objects.barriosba).features})
		.attr("d", path)
		.attr('class', 'barrios');

	svg.append("path")
		.datum({type: "FeatureCollection", features: topojson.feature(calles, calles.objects.callesba).features})
		.attr("d", path)
		.attr('class', 'calles'); 	

		drawrecorridos(lineas);

	svg.selectAll("path.hex")
		.data(topojson.feature(estaciones, estaciones.objects.estaciones).features)
		.enter()
          .append("svg:image")
          .attr('d', path)
          .attr('r', 1)
  		  .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
          .attr("xlink:href", "http://epok.buenosaires.gob.ar/media/mapa_publico//images/hexagonos/9.png")
          .attr('x', -5/s).attr('y', -5/s)
          .attr("width", 10/s).attr("height", 10/s);

    svg.selectAll("path.bici")
		.data(topojson.feature(estaciones, estaciones.objects.estaciones).features)
		.enter()
          .append("svg:image")
          .attr('d', path)
          .attr('r', 1)
  		  .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
          .attr("xlink:href", "http://epok.buenosaires.gob.ar/media/mapa_publico/ecobici/estacion_de_bicicletas.png")
          .attr('x', -5/s).attr('y', -5/s)
          .attr("width", 10/s).attr("height", 10/s);	

     svg.selectAll("path.tip")
        .data(topojson.feature(estaciones, estaciones.objects.estaciones).features)
		.enter()
        .append('text')
		//.attr('width', 0.01/s )	.attr('height', 0.01/s )
		.attr('font-size', 3/s )
		.attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
		.text(function(d) { return d.properties.nombre; })
		.attr('x', 5/s).attr('y', 0/s)
		.attr('class', 'tip')
		/* Show and hide tip on mouse events */;

          
}

function drawrecorridos(lineas){

	var select = document.getElementById("estaciondestino");
	var opcion = select.options[select.selectedIndex].value;
	svg.selectAll('.lineas')
			.data(topojson.feature(lineas, lineas.objects.lineasrecorridos).features)
			.enter().append('path')
			.attr('id', 'recorrido')
			.attr('coriginal', function(d) {return color(d.properties.count);})
			.attr("class", function(d) {return color(d.properties.count);})
	    	.attr("d", path);

}

function renderrecorridos(){

	var select = document.getElementById("estaciondestino");
	var opcion = select.options[select.selectedIndex].value;
	if(opcion == 0){
		d3.selectAll("#recorrido").each(function(d, i) {
			this.setAttribute('class',this.getAttribute('coriginal'));
	    });

	}else{
		d3.selectAll("#recorrido").each(function(d, i) {
			aux = this;
	        if(d.properties.destino != opcion){
	        	this.setAttribute('class','oculto');
	        }else{
	        	this.setAttribute('class',this.getAttribute('coriginal'));
	        }
	    });
	}
}
queue()
	.defer(d3.json, "geojson/barriosba.topojson") // topojson polygons
	.defer(d3.json, "geojson/callesba.topojson") // geojson points
	.defer(d3.json, "geojson/estaciones.topojson")
	.defer(d3.json, "geojson/lineasrecorridos.topojson")
    .await(drawMap); //function that uses files



