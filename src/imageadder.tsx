import bind from 'bind-decorator';
import * as React from 'react';

interface ImageAddedProps
{
	addImageCallback: ( url: string ) => void;
	validateUrlCallback: ( url: string ) => boolean;
}

interface ImageAdderState
{
	url: string;
}

export class ImageAdder extends React.Component< ImageAddedProps, ImageAdderState >
{
	constructor( props: any )
	{
		super( props );

		this.state = { url: "" };
	}

	@bind
	private handleChange( event: React.ChangeEvent<HTMLInputElement> ) 
	{
		this.setState( { url: event.target.value });
	}
	
	@bind
	private handleSubmit(event: React.FormEvent< HTMLFormElement > )
	{
		if (this.props.validateUrlCallback(this.state.url))
		{
			this.props.addImageCallback( this.state.url );
			event.preventDefault();
		}
		else
		{
			alert("given image is invalid"); //could eventually replace this with something on the render
			event.preventDefault();
		}
		
	}

	render()
	{
		return (
			<form onSubmit={ this.handleSubmit }>
				<label>
					Image URL to add:
					<input type="text" value={this.state.url } onChange={this.handleChange} />
				</label>
				<input type="submit" value="Submit" />
			</form> );
	}
}


