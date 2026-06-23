import Loader from "../loader/Loader";
import "./Table.css";

export default function Table({
	data,
	columns,
	actions,
	currentPage,
	totalPages,
	onPrevPage,
	onNextPage,
	isLoading
}) {
	return (
		<div className="table-container">
			<div className="table-wrapper">
				<table className="data-table">
					<thead>
						<tr>
							{columns.map((col) => (
								<th key={col.key}>{col.label}</th>
							))}
							{actions && <th>Actions</th>}
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={columns.length + (actions ? 1 : 0)}>
									<Loader />
								</td>
							</tr>
						) : data.length > 0 ? (
							data.map((row, idx) => (
								<tr key={row.id || idx}>
									{columns.map((col) => (
										<td key={col.key}>
											{col.render
												? col.render(row[col.key], row)
												: row[col.key]
											}
										</td>
									))}
									{actions && (
										<td>
											<div className="action-buttons">
												{actions.map((action) => (
													<button
														key={action.key}
														className={`btn-${action.type}`}
														onClick={() => action.handler(row)}
													>
														{action.label}
													</button>
												))}
											</div>
										</td>
									)}
								</tr>
							))
						) : (
							<tr>
								<td colSpan={columns.length + (actions ? 1 : 0)} className="no-data">
									No data found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="pagination">
					<button
						className="btn-pagination"
						onClick={onPrevPage}
						disabled={currentPage === 1}
					>
						Previous
					</button>
					<span className="pagination-info">
						Page {currentPage} of {totalPages}
					</span>
					<button
						className="btn-pagination"
						onClick={onNextPage}
						disabled={currentPage === totalPages}
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}