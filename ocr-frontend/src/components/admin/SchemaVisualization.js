import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import * as d3 from 'd3';
import tippy from 'tippy.js';
import fallbackSchema from '../../data/schema.json';

// We'll define a basic tippy style in our component
const tippyStyle = `
  .tippy-box {
    background-color: #333;
    color: white;
    border-radius: 4px;
    font-size: 14px;
    padding: 4px 8px;
  }
  .tippy-arrow {
    color: #333;
  }
`;

function SchemaVisualization() {
    const [schemaData, setSchemaData] = useState(null);
    const [usedFallback, setUsedFallback] = useState(false);
    const [layout, setLayout] = useState('grid'); // 'grid' or 'force'
    const { token } = useAuth();
    const { loading, error, schema, fetchSchema } = useAdmin();
    const svgRef = useRef(null);

    // Add tippy styles to document head
    useEffect(() => {
        // Add the tippy styles to the document head
        const styleElement = document.createElement('style');
        styleElement.textContent = tippyStyle;
        document.head.appendChild(styleElement);
        
        // Clean up when component unmounts
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    useEffect(() => {
        const getSchema = async () => {
            try {
                const data = await fetchSchema();
                if (data) {
                    setSchemaData(data);
                    setUsedFallback(false);
                } else {
                    // Use fallback if API call failed
                    setSchemaData(fallbackSchema);
                    setUsedFallback(true);
                }
            } catch (err) {
                console.error('Error getting schema data:', err);
                // Use fallback schema data
                setSchemaData(fallbackSchema);
                setUsedFallback(true);
            }
        };

        getSchema();
    }, [fetchSchema]);

    useEffect(() => {
        if (!schemaData || !svgRef.current) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll('*').remove();

        if (layout === 'grid') {
            renderGridDiagram(schemaData, svgRef.current);
        } else {
            renderForceDiagram(schemaData, svgRef.current);
        }
    }, [schemaData, layout]);

    const renderGridDiagram = (data, container) => {
        const width = 800;
        const height = 600;
        const padding = 40;
        const boxWidth = 180;
        const boxHeight = 30;
        const fieldHeight = 25;
        
        const svg = d3.select(container)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('style', 'max-width: 100%; height: auto;');

        // Define arrow markers for relationships
        svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'arrow-head')
            .style('fill', '#666');

        // Create a container for the graph
        const graph = svg.append('g');

        // Calculate positions for each model
        const models = Object.keys(data);
        const columns = Math.ceil(Math.sqrt(models.length));
        const rows = Math.ceil(models.length / columns);
        
        const columnWidth = (width - (padding * 2)) / columns;
        const rowHeight = (height - (padding * 2)) / rows;

        // Create model boxes
        models.forEach((modelName, i) => {
            const model = data[modelName];
            const fields = Object.keys(model);
            
            // Calculate box position
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = padding + (col * columnWidth) + (columnWidth - boxWidth) / 2;
            const y = padding + (row * rowHeight);
            
            // Total height of this model box including all fields
            const totalBoxHeight = boxHeight + (fields.length * fieldHeight);

            // Create model container
            const modelGroup = graph.append('g')
                .attr('transform', `translate(${x}, ${y})`)
                .attr('class', 'model-box');

            // Create model title box
            modelGroup.append('rect')
                .attr('width', boxWidth)
                .attr('height', boxHeight)
                .attr('rx', 5)
                .attr('class', 'model-title-box')
                .style('fill', '#4f46e5')
                .style('stroke', '#4338ca');

            // Add model title
            modelGroup.append('text')
                .attr('x', boxWidth / 2)
                .attr('y', boxHeight / 2)
                .attr('text-anchor', 'middle')
                .attr('alignment-baseline', 'middle')
                .text(modelName)
                .style('fill', 'white')
                .style('font-weight', 'bold');

            // Create field container
            const fieldsGroup = modelGroup.append('g')
                .attr('transform', `translate(0, ${boxHeight})`);

            // Create background for fields
            fieldsGroup.append('rect')
                .attr('width', boxWidth)
                .attr('height', fields.length * fieldHeight)
                .attr('class', 'model-fields-box')
                .style('fill', 'white')
                .style('stroke', '#e5e7eb');

            // Add each field
            fields.forEach((fieldName, j) => {
                const fieldGroup = fieldsGroup.append('g')
                    .attr('transform', `translate(0, ${j * fieldHeight})`);

                // Add field separator line
                if (j > 0) {
                    fieldGroup.append('line')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', boxWidth)
                        .attr('y2', 0)
                        .style('stroke', '#e5e7eb')
                        .style('stroke-width', 1);
                }

                // Add field name text
                const fieldText = fieldGroup.append('text')
                    .attr('x', 10)
                    .attr('y', fieldHeight / 2)
                    .attr('alignment-baseline', 'middle')
                    .text(`${fieldName}: ${model[fieldName].type}`)
                    .style('fill', '#333')
                    .style('font-size', '12px');

                // Add reference indicator if this is a reference field
                if (model[fieldName].ref) {
                    fieldText.style('font-weight', 'bold')
                        .style('fill', '#4f46e5');
                    
                    // Create tooltip with tippy
                    const node = fieldText.node();
                    if (node) {
                        tippy(node, {
                            content: `References: ${model[fieldName].ref}`,
                            placement: 'top',
                            arrow: true,
                        });
                    }
                }
            });

            // Store model position info for drawing relationships
            model._meta = {
                x: x,
                y: y,
                width: boxWidth,
                height: totalBoxHeight,
                center: {
                    x: x + boxWidth / 2,
                    y: y + totalBoxHeight / 2
                }
            };
        });

        // Draw relationships
        models.forEach(sourceModel => {
            const sourceModelFields = Object.keys(data[sourceModel]).filter(key => !key.startsWith('_'));
            
            Object.entries(data[sourceModel]).forEach(([fieldName, field]) => {
                if (field.ref && data[field.ref]) {
                    const source = data[sourceModel]._meta;
                    const target = data[field.ref]._meta;
                    
                    // Calculate connection points
                    let sx, sy, tx, ty;
                    
                    // Get field index for positioning
                    const fieldIndex = sourceModelFields.indexOf(fieldName);
                    
                    // Determine which sides to connect from
                    if (source.center.x < target.center.x) {
                        // Source is left of target
                        sx = source.x + source.width;
                        sy = source.y + (boxHeight + fieldIndex * fieldHeight + fieldHeight / 2);
                        tx = target.x;
                        ty = target.y + target.height / 2;
                    } else if (source.center.x > target.center.x) {
                        // Source is right of target
                        sx = source.x;
                        sy = source.y + (boxHeight + fieldIndex * fieldHeight + fieldHeight / 2);
                        tx = target.x + target.width;
                        ty = target.y + target.height / 2;
                    } else if (source.center.y < target.center.y) {
                        // Source is above target
                        sx = source.x + source.width / 2;
                        sy = source.y + source.height;
                        tx = target.x + target.width / 2;
                        ty = target.y;
                    } else {
                        // Source is below target
                        sx = source.x + source.width / 2;
                        sy = source.y;
                        tx = target.x + target.width / 2;
                        ty = target.y + target.height;
                    }

                    // Draw relationship line with arrow
                    graph.append('path')
                        .attr('d', `M${sx},${sy} L${tx},${ty}`)
                        .attr('marker-end', 'url(#arrow)')
                        .style('stroke', '#666')
                        .style('stroke-width', 1.5)
                        .style('fill', 'none');
                }
            });
        });
    };

    // New force-directed layout implementation
    const renderForceDiagram = (data, container) => {
        const width = 800;
        const height = 600;
        const boxWidth = 180;
        const boxHeight = 30;
        const fieldHeight = 25;
        
        const svg = d3.select(container)
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('style', 'max-width: 100%; height: auto;');

        // Define arrow markers for relationships
        svg.append('defs').append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'arrow-head')
            .style('fill', '#666');

        // Create a container for the graph
        const graph = svg.append('g');
        
        // Create nodes and links for the force simulation
        const models = Object.keys(data);
        const nodes = [];
        const links = [];
        
        // Process nodes (models)
        models.forEach(modelName => {
            const model = data[modelName];
            const fields = Object.keys(model).filter(key => !key.startsWith('_'));
            
            const node = {
                id: modelName,
                fields: fields,
                model: model,
                width: boxWidth,
                height: boxHeight + (fields.length * fieldHeight)
            };
            
            nodes.push(node);
        });
        
        // Process links (relationships)
        models.forEach(sourceModel => {
            Object.entries(data[sourceModel]).forEach(([fieldName, field]) => {
                if (field.ref && data[field.ref]) {
                    links.push({
                        source: sourceModel,
                        target: field.ref,
                        fieldName: fieldName
                    });
                }
            });
        });
        
        // Create the force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(200))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.width * d.height) / 2));
        
        // Draw links (relationships)
        const link = graph.append('g')
            .selectAll('path')
            .data(links)
            .enter().append('path')
            .attr('class', 'link')
            .attr('marker-end', 'url(#arrow)')
            .style('stroke', '#666')
            .style('stroke-width', 1.5)
            .style('fill', 'none');
        
        // Create node groups
        const node = graph.append('g')
            .selectAll('.node')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));
        
        // Draw model title boxes
        node.append('rect')
            .attr('width', d => d.width)
            .attr('height', boxHeight)
            .attr('rx', 5)
            .attr('class', 'model-title-box')
            .style('fill', '#4f46e5')
            .style('stroke', '#4338ca');
        
        // Add model titles
        node.append('text')
            .attr('x', d => d.width / 2)
            .attr('y', boxHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(d => d.id)
            .style('fill', 'white')
            .style('font-weight', 'bold');
        
        // Create field containers
        const fieldsGroup = node.append('g')
            .attr('transform', `translate(0, ${boxHeight})`);
        
        // Draw field backgrounds
        fieldsGroup.append('rect')
            .attr('width', d => d.width)
            .attr('height', d => d.fields.length * fieldHeight)
            .attr('class', 'model-fields-box')
            .style('fill', 'white')
            .style('stroke', '#e5e7eb');
        
        // Add fields
        nodes.forEach(nodeData => {
            const fields = fieldsGroup.filter(d => d.id === nodeData.id);
            
            nodeData.fields.forEach((fieldName, j) => {
                const fieldInfo = nodeData.model[fieldName];
                const fieldGroup = fields.append('g')
                    .attr('transform', `translate(0, ${j * fieldHeight})`);
                
                // Add field separator line
                if (j > 0) {
                    fieldGroup.append('line')
                        .attr('x1', 0)
                        .attr('y1', 0)
                        .attr('x2', nodeData.width)
                        .attr('y2', 0)
                        .style('stroke', '#e5e7eb')
                        .style('stroke-width', 1);
                }
                
                // Add field name text
                const fieldText = fieldGroup.append('text')
                    .attr('x', 10)
                    .attr('y', fieldHeight / 2)
                    .attr('alignment-baseline', 'middle')
                    .text(`${fieldName}: ${fieldInfo.type}`)
                    .style('fill', '#333')
                    .style('font-size', '12px');
                
                // Add reference indicator if this is a reference field
                if (fieldInfo.ref) {
                    fieldText.style('font-weight', 'bold')
                        .style('fill', '#4f46e5');
                    
                    // Create tooltip with tippy
                    const node = fieldText.node();
                    if (node) {
                        tippy(node, {
                            content: `References: ${fieldInfo.ref}`,
                            placement: 'top',
                            arrow: true,
                        });
                    }
                }
            });
        });
        
        // Update positions on simulation tick
        simulation.on('tick', () => {
            link.attr('d', d => {
                const sourceNode = nodes.find(n => n.id === d.source.id);
                const targetNode = nodes.find(n => n.id === d.target.id);
                
                // Calculate connection points
                const sx = sourceNode.x + sourceNode.width / 2;
                const sy = sourceNode.y + sourceNode.height / 2;
                const tx = targetNode.x + targetNode.width / 2;
                const ty = targetNode.y + targetNode.height / 2;
                
                return `M${sx},${sy}L${tx},${ty}`;
            });
            
            node.attr('transform', d => `translate(${d.x - d.width / 2},${d.y - d.height / 2})`);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    };

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Database Schema Visualization
                </h2>
                
                <div className="flex space-x-2">
                    <button
                        onClick={() => setLayout('grid')}
                        className={`px-3 py-1 rounded ${
                            layout === 'grid'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Grid Layout
                    </button>
                    <button
                        onClick={() => setLayout('force')}
                        className={`px-3 py-1 rounded ${
                            layout === 'force'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Force Layout
                    </button>
                </div>
            </div>
            
            {usedFallback && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Using static schema data. The API connection failed or is unavailable.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : error ? (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-medium text-gray-700 dark:text-gray-300">Entity Relationship Diagram</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {layout === 'force' ? 'Interactive diagram - drag entities to reposition' : 'Static grid layout'}
                            </p>
                        </div>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <i className="fas fa-info-circle mr-1"></i> 
                            Model count: {schemaData ? Object.keys(schemaData).length : 0}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <svg ref={svgRef} className="schema-diagram" style={{ minWidth: '800px', minHeight: '600px' }}></svg>
                    </div>

                    <div className="mt-4 text-sm border-t pt-4 border-gray-200 dark:border-gray-600">
                        <p className="text-gray-500 dark:text-gray-400">
                            <i className="fas fa-link text-blue-600 mr-1"></i> 
                            <strong>Blue text fields</strong>: Reference relationships to other models
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SchemaVisualization; 