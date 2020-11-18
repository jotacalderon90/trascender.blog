const _prompt = function(title,type,placeholder,onclose){
	return new Promise((resolve,reject)=>{
		const input = document.createElement('input');
		input.type = type;
		input.placeholder = placeholder;
		input.setAttribute('class','form-control');
		input.addEventListener( 'keypress' , function(event){
			if(event.which === 13){
				$('#mdPrompt').modal('hide');
				resolve(this.value);
			}
		});
		$('#mdPrompt h4').html(title);
		$('#mdPrompt .modal-body').html(input);
		$('#mdPrompt').modal('show');
		$('#mdPrompt button').unbind('click');
		$('#mdPrompt button').click(()=>{onclose()});
	});
};