"use strict";

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var AuthorList = React.createClass({
	propTypes: { 
		authors: React.PropTypes.array.isRequired
	},

	render: function() {
		var createAuthorRow = function(author) {
			return (
				<tr key={author.id}>
				<td><Link to="manageAuthor" params={{id: author.id}}>{author.id}</Link></td>
				<td>{author.firstName} {author.lastName}</td>
				</tr>
				);
		};

		return (
			<div>
				<table className="table">
				<thead>
					<th>ID</th>
					<th>Name</th>
				</thead>
				<tbody>
					{this.props.authors.map(createAuthorRow, this)}
				</tbody>
				</table>
			</div>
			);
	}
	});
	
	module.exports = AuthorList;