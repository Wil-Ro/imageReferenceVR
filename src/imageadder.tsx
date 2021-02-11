import bind from 'bind-decorator';
import * as React from 'react';
import * as IPFS from 'ipfs';
import Dropzone from 'react-dropzone';

interface ImageAddedProps
{
	addImageCallback: ( url: string ) => void;
	validateUrlCallback: ( url: string ) => boolean;
}

interface ImageAdderState
{
	url: string;
	message: string;
}

export class ImageAdder extends React.Component< ImageAddedProps, ImageAdderState >
{
	private ipfsNode: IPFS.IPFS = null;

	constructor( props: any )
	{
		super( props );

		this.state = { 
			url: "",
			message: "Add image url here:",
	 };

		IPFS.create().
		then( async ( newNode: any ) =>
		{
			this.ipfsNode = newNode;
			const version = await newNode.version()
			console.log('IPFS Version:', version.version );
		} );
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
			this.setState({message: "this image is either already in the list or not an image"});
			event.preventDefault();
		}
		this.setState({url: ""});
		
	}

	@bind 
	private async onFileLoad( file: File, result: ArrayBuffer ) //we add the binaries to the ipfs node then convert it into a blob we can display, when accessing this from a remote gadget you'll need to create a blob since we havent uploaded this as one
	{
		let res = await this.ipfsNode.add( new Uint8Array( result ) );
		
		const url = "/ipfs/" + res.cid;
		console.log( `Adding ${ file.name } as ${ url }` );
		const blobData: ArrayBuffer[] = [result];
		const imageBlob = new Blob(blobData);
		this.props.addImageCallback( URL.createObjectURL(imageBlob) );
	}

	@bind
	private onDrop( acceptedFiles: File[] )
	{
		for( let file of acceptedFiles )
		{
			const reader = new FileReader();

			reader.onabort = () => { console.log( "file reading was aborted for", file.name ); }
			reader.onerror = () => { console.log( "file reading has failed for", file.name ); }
			reader.onload = () => this.onFileLoad( file, reader.result as ArrayBuffer );

			reader.readAsArrayBuffer( file );
		}
	}


	render()
	{
		return (
			<div>
				<form onSubmit={ this.handleSubmit }>
					<label>
						{this.state.message}
						<br/>
						<input type="text" value={this.state.url} onChange={this.handleChange} />
					</label>
					<input type="submit" value="Submit" />
				</form>

				<Dropzone onDrop={ this.onDrop }>
				{({getRootProps, getInputProps}) => (
					<section>
					<div {...getRootProps()}>
						<input {...getInputProps()} />
						<p>Drag 'n' drop some files here, or click to select files</p>
					</div>
					</section>
				)}
				</Dropzone>
			</div> );
	}
}


