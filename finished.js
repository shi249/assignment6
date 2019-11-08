'use strict';

(function() {

  let data = "no data";
  let data1980="";
  let dataAll=""
  let svgContainer = "";
  let svgLine="";


  const margin = {all:50, width:650, height:650}

  const smallMargin =  {all:50, width:450, height:450}

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 700)
      .attr('height', 700);

    // svgLine = d3.select('body')
    //   .append('svg')
    //   .attr('width', 280)
    //   .attr('height', 280)
    //   .attr('id', 'line');
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => 
        {
          dataAll = data;
          data1980 = data.filter((row) => row['year'] == 1980)
          makeScatterPlot(data1980,svgContainer)
        });
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData, svgContainer) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, margin);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {

    svgContainer.append('text')
      .attr('x', 200)
      .attr('y', 50)
      .style('font-size', '14pt')
      .text("Life Expectancy vs. Fertility Rate(1980)");

    svgContainer.append('text')
      .attr('x', 200)
      .attr('y', 680)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 350)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .attr('id', 'tooltip')
      .style("opacity", 0);

    

    svgLine=div.append("svg")
      .attr('width', 500)
      .attr('height', 500)
      .attr('id', 'line');

    const tooltip = document.getElementById('tooltip');
    const lineGraph = document.getElementById('line');



    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('fill', "#4286f4")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          
          div.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
          // svgLine.appendChild(lineGraph);
          plotLine(d.country);
          // console.log(d.country);
          
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0)
            // svgLine.removeChild(tooltip.firstChild);
        });
  }

  function plotLine(country){
    svgLine.html("")
    let countryData = dataAll.filter((row) => {return row.country == country})
    let population = countryData.map((row) => parseInt(+row.population))
    let year = countryData.map((row) => parseInt(row.year))

    let limits=findMinMax(year, population);
    let mapFunctions = drawAxes(limits, "year", "population", svgLine, smallMargin);
    // console.log(limits.xMin + "/" +limits.xMax)

    svgLine.append('text')
      .attr('x', 150)
      .attr('y', 20)
      .style('font-size', '10pt')
      .text(country+"'s Population throughout Year");

    svgLine.append('text')
      .attr('x', 200)
      .attr('y', 480)
      .style('font-size', '10pt')
      .text('Year');

    svgLine.append('text')
      .attr('transform', 'translate(15, 250)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population');

    const line = d3.line()
        .x(d => mapFunctions.xScale(d['year'])) // set the x values for the line generator
        .y(d => mapFunctions.yScale(+d['population'])) // set the y values for the line generator 

    // append line to svg
    svgLine.append("path")
        .datum(countryData)
        .attr("d", line)
        .attr("fill", "steelblue")
        .attr("stroke", "steelblue")
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg,m) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([m.all,m.width]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, '+m.width+')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) {return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([m.all, m.height]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + m.all+', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }


  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatK(x){
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
  }

  function formatM(x){
    return Math.abs(num) > 9999 ? Math.sign(num)*((Math.abs(num)/1000000).toFixed(1)) + 'm' :formatK(x)
  }

})();