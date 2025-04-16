document.addEventListener('DOMContentLoaded', function() {
    let chart = null;
    let groupCount = 1;
    let useAutoColors = true;
    const chartCanvas = document.getElementById('chartCanvas');
    const addRowBtn = document.getElementById('addRow');
    const updateChartBtn = document.getElementById('updateChart');
    const downloadChartBtn = document.getElementById('downloadChart');
    const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    const chartTypeSelect = document.getElementById('chartType');

    // Add color mode selector
    const colorModeSelector = document.createElement('div');
    colorModeSelector.className = 'mb-3';
    colorModeSelector.innerHTML = `
        <label class="form-label">Modo de Color</label>
        <select class="form-select" id="colorMode">
            <option value="auto">Colores Automáticos</option>
            <option value="manual">Colores Personalizados</option>
        </select>
    `;
    document.querySelector('.card-body').insertBefore(colorModeSelector, addRowBtn);

    // Update color mode when selector changes
    document.getElementById('colorMode').addEventListener('change', function() {
        useAutoColors = this.value === 'auto';
        updateColorInputsVisibility();
        updateColorPreviews();
    });

    // Add group selector and group names container
    const groupSelector = document.createElement('div');
    groupSelector.className = 'mb-3';
    groupSelector.innerHTML = `
        <label for="groupCount" class="form-label">Número de Grupos</label>
        <select class="form-select" id="groupCount">
            <option value="1">1 (Sin agrupar)</option>
            <option value="2">2 grupos</option>
            <option value="3">3 grupos</option>
            <option value="4">4 grupos</option>
        </select>
        <div id="groupNames" class="mt-2"></div>
        <div id="groupColors" class="mt-2"></div>
    `;
    document.querySelector('.card-body').insertBefore(groupSelector, addRowBtn);

    // Update group count and names when selector changes
    document.getElementById('groupCount').addEventListener('change', function() {
        groupCount = parseInt(this.value);
        updateTableHeaders();
        updateGroupNames();
    });

    function updateGroupNames() {
        const groupNamesContainer = document.getElementById('groupNames');
        const groupColorsContainer = document.getElementById('groupColors');
        groupNamesContainer.innerHTML = '';
        groupColorsContainer.innerHTML = '';
        
        for (let i = 1; i <= groupCount; i++) {
            // Crear input para nombre del grupo
            const groupNameInput = document.createElement('div');
            groupNameInput.className = 'mb-2';
            groupNameInput.innerHTML = `
                <input type="text" class="form-control group-name" 
                       data-group="${i}" 
                       placeholder="Nombre del Grupo ${i}">
            `;
            groupNamesContainer.appendChild(groupNameInput);

            // Crear selector de color para el grupo
            const groupColorDiv = document.createElement('div');
            groupColorDiv.className = 'd-flex align-items-center mb-2';
            groupColorDiv.innerHTML = `
                <label class="me-2">Color Grupo ${i}:</label>
                <div class="color-preview" data-group="${i}" 
                     style="width: 30px; height: 30px; border-radius: 4px; margin-right: 5px; cursor: pointer; 
                            background-color: ${getColorForIndex(i-1)}"></div>
                <input type="color" class="color-input" data-group="${i}" 
                       style="display: ${useAutoColors ? 'none' : 'block'}" 
                       value="${getColorForIndex(i-1)}">
            `;
            groupColorsContainer.appendChild(groupColorDiv);

            // Agregar eventos para el selector de color
            const colorPreview = groupColorDiv.querySelector('.color-preview');
            const colorInput = groupColorDiv.querySelector('.color-input');

            colorPreview.addEventListener('click', function() {
                if (!useAutoColors) {
                    colorInput.click();
                }
            });

            colorInput.addEventListener('change', function() {
                if (!useAutoColors) {
                    colorPreview.style.backgroundColor = this.value;
                    if (chart) {
                        updateChartBtn.click();
                    }
                }
            });
        }
    }

    function updateTableHeaders() {
        const headerRow = document.querySelector('#dataTable thead tr');
        headerRow.innerHTML = '<th>Etiqueta</th>';
        for (let i = 1; i <= groupCount; i++) {
            headerRow.innerHTML += `<th>Valor Grupo ${i}</th>`;
        }
        headerRow.innerHTML += '<th>Color</th><th>Acciones</th>';

        // Update existing rows
        const rows = dataTable.getElementsByTagName('tr');
        Array.from(rows).forEach((row, index) => {
            const cells = row.getElementsByTagName('td');
            const label = cells[0].innerHTML;
            const actions = cells[cells.length - 1].innerHTML;
            
            row.innerHTML = `<td>${label}</td>`;
            for (let i = 0; i < groupCount; i++) {
                row.innerHTML += `<td><input type="number" class="form-control" placeholder="Valor"></td>`;
            }
            
            if (groupCount === 1) {
                const color = useAutoColors ? getColorForIndex(index) : getColorForIndex(index);
                row.innerHTML += `
                    <td>
                        <div class="color-preview" style="width: 30px; height: 30px; border-radius: 4px; cursor: pointer; background-color: ${color}"></div>
                        <input type="color" class="color-input" style="display: ${useAutoColors ? 'none' : 'block'}" value="${color}">
                    </td>`;
            } else {
                row.innerHTML += '<td></td>';
            }
            
            row.innerHTML += `<td>${actions}</td>`;
        });
    }

    // Update table headers based on chart type
    chartTypeSelect.addEventListener('change', function() {
        const rows = dataTable.getElementsByTagName('tr');
        const headers = document.querySelectorAll('#dataTable thead th');
        if (this.value === 'scatter') {
            headers[0].textContent = 'X';
            headers[1].textContent = 'Y';
            Array.from(rows).forEach(row => {
                row.getElementsByTagName('input')[0].placeholder = 'X';
                row.getElementsByTagName('input')[1].placeholder = 'Y';
            });
        } else {
            headers[0].textContent = 'Etiqueta';
            headers[1].textContent = 'Valor';
            Array.from(rows).forEach(row => {
                row.getElementsByTagName('input')[0].placeholder = 'Etiqueta';
                row.getElementsByTagName('input')[1].placeholder = 'Valor';
            });
        }
    });

    // Initialize color picker for first row
    function initializeColorPicker(row) {
        const colorPreview = row.querySelector('.color-preview');
        const colorInput = row.querySelector('.color-input');

        if (colorPreview && colorInput) {
            colorPreview.addEventListener('click', function() {
                if (!useAutoColors) {
                    colorInput.click();
                }
            });

            colorInput.addEventListener('change', function() {
                if (!useAutoColors) {
                    const color = this.value;
                    colorPreview.style.backgroundColor = color;
                    
                    // Actualizar el color en el dataset correspondiente
                    if (chart) {
                        const row = this.closest('tr');
                        const rowIndex = Array.from(dataTable.children).indexOf(row);
                        
                        if (chart.data.datasets.length > 0) {
                            if (groupCount === 1) {
                                chart.data.datasets[0].backgroundColor[rowIndex] = color;
                                chart.data.datasets[0].borderColor[rowIndex] = color;
                            } else {
                                chart.data.datasets.forEach(dataset => {
                                    dataset.backgroundColor = color;
                                    dataset.borderColor = color;
                                });
                            }
                            chart.update();
                        }
                    }
                }
            });
        }
    }

    // Initialize first row
    initializeColorPicker(dataTable.querySelector('tr'));

    // Add new row to the table
    function getColorForIndex(index) {
        const colors = [
            '#2c3e50', // Azul oscuro
            '#e74c3c', // Rojo brillante
            '#3498db', // Azul
            '#f1c40f', // Amarillo
            '#1abc9c', // Turquesa
            '#9b59b6', // Morado
            '#27ae60', // Verde
            '#e67e22', // Naranja
            '#34495e', // Gris azulado
            '#16a085', // Verde azulado
            '#c0392b', // Rojo oscuro
            '#2980b9', // Azul medio
            '#8e44ad', // Morado oscuro
            '#d35400', // Naranja oscuro
            '#2ecc71', // Verde claro
            '#f39c12', // Naranja claro
            '#7f8c8d', // Gris
            '#2c3e50', // Azul marino
            '#c0392b', // Rojo vino
            '#16a085', // Verde esmeralda
            '#8e44ad', // Púrpura
            '#d35400', // Naranja quemado
            '#27ae60', // Verde bosque
            '#2980b9', // Azul real
            '#f1c40f', // Amarillo sol
            '#e74c3c', // Rojo coral
            '#1abc9c', // Turquesa marino
            '#34495e', // Gris pizarra
            '#9b59b6', // Lavanda
            '#e67e22'  // Naranja mandarina
        ];
        // Usar un desplazamiento para evitar colores consecutivos similares
        const offset = Math.floor(index / colors.length) * 7;
        return colors[(index + offset) % colors.length];
    }

    function updateColorPreviews() {
        const rows = dataTable.getElementsByTagName('tr');
        Array.from(rows).forEach((row, index) => {
            const colorCell = row.cells[row.cells.length - 2];
            if (groupCount === 1) {
                const color = useAutoColors ? getColorForIndex(index) : (row.querySelector('.color-input')?.value || getColorForIndex(index));
                colorCell.innerHTML = `
                    <div class="color-preview" style="width: 30px; height: 30px; border-radius: 4px; cursor: pointer; background-color: ${color}"></div>
                    <input type="color" class="color-input" style="display: ${useAutoColors ? 'none' : 'block'}" value="${color}">
                `;
                
                const colorPreview = colorCell.querySelector('.color-preview');
                const colorInput = colorCell.querySelector('.color-input');
                
                colorPreview.addEventListener('click', function() {
                    if (!useAutoColors) {
                        colorInput.click();
                    }
                });
                
                colorInput.addEventListener('change', function() {
                    if (!useAutoColors) {
                        const color = this.value;
                        colorPreview.style.backgroundColor = color;
                        if (chart && chart.data.datasets.length > 0) {
                            chart.data.datasets[0].backgroundColor[index] = color;
                            chart.data.datasets[0].borderColor[index] = color;
                            chart.update();
                        }
                    }
                });
            } else {
                colorCell.innerHTML = '';
            }
        });
    }

    function updateColorInputsVisibility() {
        const groupColorInputs = document.querySelectorAll('#groupColors .color-input');
        groupColorInputs.forEach(input => {
            input.style.display = useAutoColors ? 'none' : 'block';
        });
    }

    addRowBtn.addEventListener('click', function() {
        const isScatter = chartTypeSelect.value === 'scatter';
        const newRow = document.createElement('tr');
        let rowHtml = `<td><input type="${isScatter ? 'number' : 'text'}" class="form-control" placeholder="${isScatter ? 'X' : 'Etiqueta'}"></td>`;
        
        for (let i = 0; i < groupCount; i++) {
            rowHtml += `<td><input type="number" class="form-control" placeholder="Valor Grupo ${i + 1}"></td>`;
        }
        
        if (groupCount === 1) {
            const rowIndex = dataTable.children.length;
            const color = useAutoColors ? getColorForIndex(rowIndex) : getColorForIndex(rowIndex);
            rowHtml += `
                <td>
                    <div class="color-preview" style="width: 30px; height: 30px; border-radius: 4px; cursor: pointer; background-color: ${color}"></div>
                    <input type="color" class="color-input" style="display: ${useAutoColors ? 'none' : 'block'}" value="${color}">
                </td>`;
        } else {
            rowHtml += '<td></td>';
        }
        
        rowHtml += `
            <td>
                <button class="btn btn-danger btn-sm delete-row">Eliminar</button>
            </td>
        `;
        newRow.innerHTML = rowHtml;
        dataTable.appendChild(newRow);

        // Inicializar el selector de color para la nueva fila
        if (groupCount === 1) {
            const colorPreview = newRow.querySelector('.color-preview');
            const colorInput = newRow.querySelector('.color-input');

            if (colorPreview && colorInput) {
                colorPreview.addEventListener('click', function() {
                    if (!useAutoColors) {
                        colorInput.click();
                    }
                });

                colorInput.addEventListener('change', function() {
                    if (!useAutoColors) {
                        const color = this.value;
                        colorPreview.style.backgroundColor = color;
                        
                        const row = this.closest('tr');
                        const rowIndex = Array.from(dataTable.children).indexOf(row);
                        
                        if (chart && chart.data.datasets.length > 0) {
                            chart.data.datasets[0].backgroundColor[rowIndex] = color;
                            chart.data.datasets[0].borderColor[rowIndex] = color;
                            chart.update();
                        }
                    }
                });
            }
        }

        updateColorPreviews();
    });

    // Delete row from table
    dataTable.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-row')) {
            e.target.closest('tr').remove();
            updateColorPreviews();
        }
    });

    // Update chart
    updateChartBtn.addEventListener('click', function() {
        const rows = dataTable.getElementsByTagName('tr');
        const chartType = chartTypeSelect.value;
        const isScatter = chartType === 'scatter';
        
        let datasets = [];
        let labels = [];

        if (isScatter) {
            let scatterData = [];
            for (let i = 0; i < rows.length; i++) {
                const inputs = rows[i].getElementsByTagName('input');
                const x = parseFloat(inputs[0].value);
                const y = parseFloat(inputs[1].value);
                const colorInput = rows[i].querySelector('.color-input');
                const color = useAutoColors ? getColorForIndex(i) : (colorInput.value || getColorForIndex(i));

                if (!isNaN(x) && !isNaN(y)) {
                    scatterData.push({x: x, y: y});
                }
            }
            if (scatterData.length > 0) {
                datasets.push({
                    label: 'Scatter Plot',
                    data: scatterData,
                    backgroundColor: getColorForIndex(0),
                    borderColor: getColorForIndex(0),
                    borderWidth: 1
                });
            }
        } else if (chartType === 'pie') {
            let labels = [];
            let data = [];
            let colors = [];

            for (let i = 0; i < rows.length; i++) {
                const inputs = rows[i].getElementsByTagName('input');
                const label = inputs[0].value;
                const value = parseFloat(inputs[1].value);
                const colorInput = rows[i].querySelector('.color-input');
                const color = useAutoColors ? getColorForIndex(i) : (colorInput.value || getColorForIndex(i));

                if (label && !isNaN(value)) {
                    labels.push(label);
                    data.push(value);
                    colors.push(color);
                }
            }

            datasets = [{
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1
            }];
        } else {
            for (let i = 0; i < rows.length; i++) {
                const inputs = rows[i].getElementsByTagName('input');
                const label = inputs[0].value;
                if (label) {
                    labels.push(label);
                }
            }

            // Create a dataset for each group with custom names
            if (groupCount === 1) {
                // Handle non-grouped data
                let data = [];
                let colors = [];
                for (let i = 0; i < rows.length; i++) {
                    const inputs = rows[i].getElementsByTagName('input');
                    const value = parseFloat(inputs[1].value);
                    const colorInput = rows[i].querySelector('.color-input');
                    const color = useAutoColors ? getColorForIndex(i) : (colorInput.value || getColorForIndex(i));
                    if (!isNaN(value)) {
                        data.push(value);
                        colors.push(color);
                    }
                }
                if (data.length > 0) {
                    datasets.push({
                        label: 'Valores',
                        data: data,
                        backgroundColor: colors,
                        borderColor: colors,
                        borderWidth: 1
                    });
                }
            } else {
                // Handle grouped data
                for (let g = 0; g < groupCount; g++) {
                    let groupData = [];
                    const colorInput = document.querySelector('#groupColors .color-input[data-group="' + (g + 1) + '"]');
                    const groupColor = useAutoColors ? getColorForIndex(g) : (colorInput ? colorInput.value : getColorForIndex(g));
                    const groupNameInput = document.querySelector(`.group-name[data-group="${g + 1}"]`);
                    const groupName = groupNameInput ? groupNameInput.value || `Grupo ${g + 1}` : `Grupo ${g + 1}`;

                    for (let i = 0; i < rows.length; i++) {
                        const inputs = rows[i].getElementsByTagName('input');
                        const value = parseFloat(inputs[g + 1].value);
                        if (!isNaN(value)) {
                            groupData.push(value);
                        }
                    }

                    if (groupData.length > 0) {
                        datasets.push({
                            label: groupName,
                            data: groupData,
                            backgroundColor: groupColor,
                            borderColor: groupColor,
                            borderWidth: 1
                        });
                    }
                }
            }
        }

        if (chart) {
            chart.destroy();
        }

        Chart.register(ChartDataLabels);
        const chartConfig = {
            type: chartType,
            data: {
                labels: chartType === 'scatter' ? undefined : labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    datalabels: {
                        display: function(context) {
                            return context.chart.data.datasets[context.datasetIndex].type !== 'scatter' && 
                                   context.chart.data.datasets[context.datasetIndex].type !== 'pie';
                        },
                        color: '#000',
                        anchor: 'end',
                        align: 'top',
                        formatter: function(value) {
                            return Number.isInteger(value) ? value.toString() : value.toFixed(2);
                        }
                    },
                    title: {
                        display: true,
                        text: document.getElementById('chartTitle').value || 'Gráfica',
                        padding: {
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (chartType === 'pie') {
                                    return data.labels.map((label, i) => ({
                                        text: label,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: i,
                                        datasetIndex: 0
                                    }));
                                } else if (chartType === 'scatter') {
                                    return [{
                                        text: 'Scatter Plot',
                                        fillStyle: data.datasets[0].backgroundColor,
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: 1,
                                        hidden: false
                                    }];
                                } else if (groupCount === 1) {
                                    // For non-grouped data, show individual legend items
                                    return data.labels.map((label, i) => ({
                                        text: label,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        lineWidth: 1,
                                        hidden: false,
                                        index: i,
                                        datasetIndex: 0
                                    }));
                                } else {
                                    // For grouped data, show group-level legend items
                                    return data.datasets.map((dataset, i) => ({
                                        text: dataset.label,
                                        fillStyle: dataset.backgroundColor,
                                        strokeStyle: dataset.borderColor,
                                        lineWidth: 1,
                                        hidden: false,
                                        datasetIndex: i
                                    }));
                                }
                            }
                        },
                        onClick: function(e, legendItem, legend) {
                            const index = legendItem.datasetIndex;
                            const ci = legend.chart;
                            
                            if (chartType === 'pie' || (chartType !== 'scatter' && groupCount === 1)) {
                                const meta = ci.getDatasetMeta(0);
                                const index = legendItem.index;
                                const alreadyHidden = meta.data[index].hidden || false;
                                meta.data[index].hidden = !alreadyHidden;
                            } else {
                                const meta = ci.getDatasetMeta(index);
                                meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                            }
                            ci.update();
                        }
                    }
                },
                scales: chartType !== 'pie' ? {
                    x: {
                        title: {
                            display: true,
                            text: document.getElementById('xAxisLabel').value || (isScatter ? 'X' : 'Categorías')
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: document.getElementById('yAxisLabel').value || (isScatter ? 'Y' : 'Valores')
                        }
                    }
                } : {}
            }
        };

        chart = new Chart(chartCanvas, chartConfig);
    });

    // Initial setup
    updateGroupNames();
    updateChartBtn.click();

    // Download chart as JPG
    downloadChartBtn.addEventListener('click', function() {
        if (chart) {
            const link = document.createElement('a');
            const chartTitle = document.getElementById('chartTitle').value || 'chart';
            link.download = `${chartTitle}.jpg`;
            
            // Create a temporary canvas to draw with white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = chartCanvas.width;
            tempCanvas.height = chartCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Fill white background
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the original chart on top
            tempCtx.drawImage(chartCanvas, 0, 0);
            
            // Get the image data with white background
            link.href = tempCanvas.toDataURL('image/jpeg', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});