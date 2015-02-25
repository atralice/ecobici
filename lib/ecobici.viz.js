
//Globales - Es mejor no tenerlas
var svgArea

var color = d3.scale.quantize()
  .domain([0, 9000]) //Arreglar para que calcule el rango este y no este hardcodeado
  .range(d3.range(5).map(function(d) { return "q" + d + "-3"; }));
var width = 600, height = 525;
//var t = [-985920.143529706,-513714.48739570886];
var t = [-1424436.1305570588,-741809.7208841285]
var s = 2967.5341152680844;
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
function drawMap(error, barrios , calles,  estaciones, lineas) {
	
	svg.append("path")
		.datum({type: "FeatureCollection", features: topojson.feature(barrios, barrios.objects.barriosba).features})
		.attr("d", path)
		.attr('class', 'barrios');
	
	svg.append("path")
		.datum({type: "FeatureCollection", features: topojson.feature(calles, calles.objects.callesba).features})
		.attr("d", path)
		.attr('class', 'calles'); 
		drawrecorridos(lineas);

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

	svg.selectAll("path.hex")
		.data(topojson.feature(estaciones, estaciones.objects.estaciones).features)
		.enter()
          .append("svg:image")
          .attr('d', path)
          .attr('r', 1)
  		  .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
          .attr("xlink:href", "http://epok.buenosaires.gob.ar/media/mapa_publico//images/hexagonos/9.png")
          .attr('x', -5/s).attr('y', -5/s)
          .attr("width", 10/s).attr("height", 10/s)
          ;

    svg.selectAll("path.bici")
		.data(topojson.feature(estaciones, estaciones.objects.estaciones).features)
		.enter()
          .append("svg:image")
          .attr('d', path)
          .attr('r', 1)
  		  .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
          .attr("xlink:href", "http://epok.buenosaires.gob.ar/media/mapa_publico/ecobici/estacion_de_bicicletas.png")
          .attr('x', -5/s).attr('y', -5/s)
          .attr("width", 10/s).attr("height", 10/s)
          .on('click', function(d){
			return update(d.properties.id, d.properties.nombre);});	


          
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
	var selectori = document.getElementById("estacionorigen");
	var opcion = select.options[select.selectedIndex].value;
	var opcionori = select.options[selectori.selectedIndex].value;

	console.log(opcion);
	console.log(opcionori);

	if(opcion == 0 && opcionori == 0){
		d3.selectAll("#recorrido").each(function(d, i) {
			this.setAttribute('class',this.getAttribute('coriginal'));
	    });

	}
	if(opcion != 0 && opcionori != 0){
		d3.selectAll("#recorrido").each(function(d, i) {
	        if(d.properties.destino == opcion && d.properties.origen == opcionori){
	        	this.setAttribute('class',this.getAttribute('coriginal'));
	        }else{
	        	this.setAttribute('class','oculto');
	        }
	    });
	}
	if(opcion == 0 && opcionori != 0){
		d3.selectAll("#recorrido").each(function(d, i) {
	        if(d.properties.origen == opcionori){
	        	this.setAttribute('class',this.getAttribute('coriginal'));
	        }else{
	        	this.setAttribute('class','oculto');
	        }
	    });
	}
	if(opcion != 0 && opcionori == 0){
		d3.selectAll("#recorrido").each(function(d, i) {
	        if(d.properties.destino == opcion){
	        	this.setAttribute('class',this.getAttribute('coriginal'));
	        }else{
	        	this.setAttribute('class','oculto');
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

queue()
	.defer(d3.csv, "data/area.csv")
	.defer(d3.csv, 'data/areaMes.csv')
    .await(drawArea); //function that uses files

function drawArea(error, dday , dmes, update, nombre){

	//var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
	var parseDate = d3.time.format("%Y-%m-%d").parse;

	if(!update){
		dday.forEach(function(d) {
		    d.date = parseDate(d.date);
		    d.count = +d.count;
	  });
		dmes.forEach(function(d) {
		    d.date = parseDate(d.date);
		    d.count = +d.count;
	  });
		nombre = 'TODAS';
		aux = dday;
		area = dmes;
	}else{
		area = dday;
	}

	
	var margin = {top: 15, right: 15, bottom: 100, left: 45},
	    width = 600 - margin.left - margin.right,
	    height = 300 - margin.top - margin.bottom;

	var x = d3.time.scale()
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x).tickFormat(d3.time.format('%b'))
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");

	var areagraph = d3.svg.area()
	    .x(function(d) { return x(d.date); })
	    .y0(height)
	    .y1(function(d) { return y(d.count); });

	
	var svgArea = d3.select('#garea').append('svg')
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		 	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	  x.domain(d3.extent(area, function(d) { return d.date; }));
	  y.domain([0, d3.max(area, function(d) { return d.count; })]); //si pongo area cambian las escalas.

	 if(update){
		 d3.select('#garea').select('svg').remove();
		}
	 svgArea.append("path")
		      .datum(area)
		      .attr("class", "area")
		      .attr("d", areagraph);

	  svgArea.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  
	  svgArea.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	      .append("text")
	      .attr("transform", "translate(75, -20)rotate(0)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Cantidad de Viajes");

	   svgArea.append("g")
	      .attr("class", "nombreestacion")
	      .append("text")
	      .attr("transform", "translate("+width+", -20)rotate(0)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .text(nombre);


}

function update(estacion, nombre){
	//&& d.date <  new Date(a, m, d)
	newarea = aux.filter(function(d){
		return (d.origenestacionid == estacion) });
	drawArea(null,newarea, null, 1, nombre);
}