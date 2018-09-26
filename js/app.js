$(document).ready(function() {

  var instancesDataSource = br.dataSource(br.baseUrl + 'data/instances.json');
  instancesDataSource.on('error', function(operation, error) { br.growlError(error); });
  instancesDataSource.on('calcFields', function(row) {
    if (row.pricePerHour) {
      row.pricePerHour  = row.pricePerHour.toFixed(3);
    } else
    if (row.pricePerMonth) {
      row.pricePerHour = (row.pricePerMonth / 720).toFixed(2);
    }
    if (!row.pricePerDay) {
      row.pricePerDay   = (row.pricePerHour * 24).toFixed(2);
    } else {
      row.pricePerDay = row.pricePerDay.toFixed(2);
    }
    if (!row.pricePerMonth) {
      row.pricePerMonth = (row.pricePerHour * 720).toFixed(2);
    } else {
      row.pricePerMonth = row.pricePerMonth.toFixed(2);
    }
  });

  var instancesDataGrid = br.dataGrid($('#instancesTable'), $('#instanceRow'), instancesDataSource);
  instancesDataGrid.on('change', function() {
    $('.tooltip-element').each(function() {
      $(this).popover({placement: 'bottom', trigger: 'hover' });
    });
    $('.tooltip-element').popover({placement: 'bottom'});
    br.modified('input.data-field[name=amount]', function() {
      calculateCosts();
    });
    var selection = br.storage.get('selection', {});
    var idx = 1;
    $('tr.data-row').each(function() {
      var data = $(this).data('data-row');
      var saved = selection[idx++];
      if (!br.isEmpty(saved)) {
        var input = $(this).find('input.data-field[name=amount]');
        input.val(saved);
      }
    });
    $('.tablesorter').tablesorter({
         theme : 'bootstrap'
       , headerTemplate: '{content} {icon}'
       , widgets: ['uitheme', 'saveSort']
       , headers: {
             0: { sorter: false }
           , 1: { sorter: false }
           , 2: { sorter: false }
           , 5: { sorter: false }
         }
    });
    $('.tablesorter').trigger('update');
    filterData();
    calculateCosts();
  });

  var filters = br.storage.get('filters', { });

  function resize() {
    var top = $('#mainContainer').position().top;
    var height = $(window).height() - top;
    $('#mainContainer').css('height', height + 'px');
  }

  $(window).on('resize', function() {
    resize();
  })

  function calculateCosts() {
    var cost = { perHour: 0, perDay: 0, perMonth: 0 };
    var totalAmount = 0;
    var selection = { }
    var idx = 1;
    $('tr.data-row').each(function() {
      var input = $(this).find('input.data-field[name=amount]');
      var amount = input.val();
      var data = $(this).data('data-row');
      if (br.isEmpty(amount)) { amount = 0; } else { amount = br.toInt(amount); }
      if (amount > 0) {
        cost.perHour  = cost.perHour  + data.pricePerHour  * amount;
        cost.perDay   = cost.perDay   + data.pricePerDay   * amount;
        cost.perMonth = cost.perMonth + data.pricePerMonth * amount;
        totalAmount   = totalAmount + amount;
        $(this).addClass('success');
        $(this).removeClass('no-print');
      } else {
        $(this).removeClass('success');
        $(this).addClass('no-print');
      }
      selection[idx++] = amount;
    });
    br.storage.set('selection', selection);
    cost.perHour = cost.perHour.toFixed(3);
    cost.perDay = cost.perDay.toFixed(2);
    cost.perMonth = cost.perMonth.toFixed(2);
    $('#costPerHour').text('$' + cost.perHour);
    $('#costPerDay').text('$' + cost.perDay);
    $('#costPerMonth').text('$' + cost.perMonth);
    $('#amountOfInstances').text(totalAmount);
  }

  function renderFilters() {
    $('.filters-area').html('');
    for(var fieldName in filters) {
      $('.filters-area').append(br.fetch($('#filterBadge').html(), { fieldName: fieldName, value: filters[fieldName] }));
    }
    resize();
  }

  function filterData() {
    var filtersExists = false;
    for(var fieldName in filters) {
      filtersExists = true;
      break;
    }

    if (filtersExists) {
      $('tr.data-row').each(function() {
        var data = $(this).data('data-row');
        var ok = true;
        for(var fieldName in filters) {
          if (data[fieldName] != filters[fieldName]) {
            ok = false;
          }
        }
        if (ok) {
          $(this).removeClass('filtered-out');
        } else {
          $(this).addClass('filtered-out');
        }
      });
    } else {
      $('tr.data-row').removeClass('filtered-out');
    }
  }

  $(document).on('click', '.action-plus', function() {
    var input = $(this).closest('tr').find('input.data-field[name=amount]');
    var amount = input.val();
    if (br.isEmpty(amount)) {
      amount = 0;
    } else {
      amount = br.toInt(amount);
    }
    amount++;
    input.val(amount);
    calculateCosts();
  });

  $(document).on('click', '.action-minus', function() {
    var input = $(this).closest('tr').find('input.data-field[name=amount]');
    var amount = input.val();
    if (br.isEmpty(amount)) {
      amount = 0;
    } else {
      amount = br.toInt(amount);
    }
    amount--;
    if (amount < 0) {
      amount = 0;
    }
    input.val(amount);
    calculateCosts();
  });

  $('.action-print').click(function() {
    window.print();
  });

  $('.action-clear').on('click', function(evt) {
    $('input.data-field[name=amount]').val(0);
    calculateCosts();
    return false;
  });

  $('.action-filter').on('click', function(evt) {
    var fieldName = $(this).attr('data-field-name');
    filters[fieldName] = $(this).attr('data-value');
    br.storage.set('filters', filters);
    renderFilters();
    filterData();
  });

  $('.action-clear-filter').on('click', function() {
    var fieldName = $(this).attr('data-field-name');
    var newFilters = {};
    for(var i in filters) {
      if (i != fieldName) {
        newFilters[i] = filters[i];
      }
    }
    filters = newFilters;
    br.storage.set('filters', filters);
    renderFilters();
    filterData();
  });

  resize();
  renderFilters();
  instancesDataSource.select();

});