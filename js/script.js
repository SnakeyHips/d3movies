//Zoomable Sunburst on d3.js v4 from: https://bl.ocks.org/maybelinot/5552606564ef37b5de7e47ed2b7dc099
var width = document.getElementById('vis').clientWidth;
var height = document.getElementById('vis').clientHeight;
var radius = (Math.min(width, height) / 2) - 10;

//data object made for selecting decade
var data = {};

var x = d3.scaleLinear()
    .range([0, 2 * Math.PI]);

var y = d3.scaleSqrt()
    .range([0, radius]);

var partition = d3.partition();

//variable for turning values into percentages
var toPercent = d3.format("0.1%");

//using d3 colorbrewer for colour scheme: http://colorbrewer2.org/
var colors = ["#5C86C4", "#656CCA", "#7A62C9", "#8F5DC7", "#AA56C5", "#D559B0", "#EA6292", "#FF6B6B", "#FF9B6B", "#FFB66B",
    "#FFC86B", "#FFD76B", "#FFE66B", "#FFF46B", "#F1FC6A", "#D0F667", "#D0F667", "#5CDD5C", "#53C69D", "#53A6BE"
];

var arc = d3.arc()
    .startAngle(function(d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
    })
    .endAngle(function(d) {
        return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
    })
    .innerRadius(function(d) {
        return Math.max(0, y(d.y0));
    })
    .outerRadius(function(d) {
        return Math.max(0, y(d.y1));
    });

//viewBox for responsive svg code from: https://www.w3.org/TR/SVGTiny12/coords.html#ViewBoxAttribute
var svg = d3.select("#chart")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + width + " " + height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

var leg = d3.select("#legend");

var tips = d3.select('#tooltips');

d3.select("#togglelegend").on("click", toggleLegend);
d3.select("#toggletips").on("click", toggleTips);

//queue all json files so all loaded ready to go for decade selection
d3.queue()
    .defer(d3.json, "jsonFiles/movies2010.json")
    .defer(d3.json, "jsonFiles/movies2000.json")
    .defer(d3.json, "jsonFiles/movies1990.json")
    .defer(d3.json, "jsonFiles/movies1980.json")
    .defer(d3.json, "jsonFiles/movies1970.json")
    .defer(d3.json, "jsonFiles/movies1960.json")
    .defer(d3.json, "jsonFiles/movies1950.json")
    .defer(d3.json, "jsonFiles/movies1940.json")
    .defer(d3.json, "jsonFiles/movies1930.json")
    .await(function(error, d2010, d2000, d1990, d1980, d1970, d1960, d1950, d1940, d1930) {
        data['1930'] = d1930;
        data['1940'] = d1940;
        data['1950'] = d1950;
        data['1960'] = d1960;
        data['1970'] = d1970;
        data['1980'] = d1980;
        data['1990'] = d1990;
        data['2000'] = d2000;
        data['2010'] = d2010
        draw('2010')
        drawLegend('2010');
    });

//slider for changing json decade data to be loaded
var slider = d3.select('#decade');
slider.on('change', function() {
    decadeSelected = this.value;
    fadeOut()
    //time out to make sure svg has faded out before new data put in code from: https://www.w3schools.com/jsref/met_win_settimeout.asp
    setTimeout(function() {
        //first clear contests to update new
        svg.selectAll("path").remove()
        leg.selectAll("svg").remove()
        drawLegend(decadeSelected)
        draw(decadeSelected);
    }, 250)
    setTimeout(function() {
        fadeIn();
    }, 250);
});

function draw(decade) {

    var root = data[decade];
    root = d3.hierarchy(root);
    root.sum(function(d) {
        return d.size;
    });
    var color = d3.scaleOrdinal(colors);

    var sunburst = svg.selectAll("path")
        .data(partition(root).descendants());

    sunburst
        .enter()
        .append("path")
        .attr("d", arc)
        .style("fill", function(d) {
            return color((d.children ? d : d.parent).data.name);
        })
        //function to stop displaying children that have no name :(
        .style("opacity", function(d) {
            if (d.data.name !== "") {
                return 1;
            } else {
                return 0;
            }
        })
        .on("click", click)
        .append("title")
        .text(function(d) {
            return (d.data.name + ": " + toPercent(d.value / root.value));
        });
};

//function which "zooms" in sunburst when clicking on data area
function click(d) {
    svg.transition()
        .duration(750)
        .tween("scale", function() {
            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
            return function(t) {
                x.domain(xd(t));
                y.domain(yd(t)).range(yr(t));
            };
        })
        .selectAll("path")
        .attrTween("d", function(d) {
            return function() {
                return arc(d);
            };
        });
};

function drawLegend(decade) {

    var root = data[decade];
    //create hierarchy and sum function to find out total size of all date used for percentages
    var rootTotal = d3.hierarchy(root);
    rootTotal.sum(function(d) {
        return d.size;
    });
    //create copy of colors array without first element using slice()
    var colorsLegend = colors.slice(1, colors.length);
    var color = d3.scaleOrdinal(colorsLegend);
    //code helped for creating legend from: https://bl.ocks.org/kerryrodden/766f8f6d31f645c39f488a0befa1e3c8
    var li = {
        w: 150,
        h: 30,
        s: 3,
        r: 3
    };
    var legend = d3.select("#legend")
        .append("svg:svg")
        .attr("width", li.w)
        .attr("height", root.children.length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.values(root)[1])
        .enter()
        .append("svg:g")
        .attr("transform", function(d, i) {
            return "translate(0," + i * (li.h + li.s) + ")";
        });

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.w)
        .attr("height", li.h)
        .style("fill", function(d) {
            return color(d.name);
        })

    g.append("svg:text")
        .attr("x", li.w / 2)
        .attr("y", li.h / 2)
        .attr("dy", "0.3em")
        .attr("text-anchor", "middle")
        .text(function(d, i) {
            return d.name + ": " + toPercent(rootTotal.children[i].value / rootTotal.value)
        });
}

function toggleLegend() {
    if (leg.style("opacity") == 0) {
        leg.transition()
            .style("opacity", 1);
    } else {
        leg.transition()
            .style("opacity", 0);
    }
}

function toggleTips() {
    if (tips.style("opacity") == 0) {
        tips.transition()
            .style("opacity", 1);
    } else {
        tips.transition()
            .style("opacity", 0);
    }
}


//funciton to fade out svg
function fadeOut() {
    svg.transition()
        .style("opacity", 0);
};

//function to fade in svg
function fadeIn() {
    svg.transition()
        .style("opacity", 1);
};



d3.select(self.frameElement).style("height", height + "px");
