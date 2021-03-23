$( "#target" ).submit( event => {
    event.preventDefault();
    $.ajax({
        method: "POST",
        url: "/api/admin/referrals",
        success: ( result ) => {
          $( "#errorDiv" ).html( "<strong>" + result + "</strong>" );
        },
        error: ( error ) => {
            $( "#errorDiv" )
            .html(`
              <div class="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>${error.statusText}! ${error.status}</strong>
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              </div>`
            );
        }
      });
  });