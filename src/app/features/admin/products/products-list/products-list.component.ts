import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Product, ProductPayload } from '../../../../shared/interfaces/product';
import { ProductService } from '../../../services/product.service';
import { ProductDeleteDialogComponent } from '../product-delete-dialog/product-delete-dialog.component';
import { ProductFormDialogComponent } from '../product-form-dialog/product-form-dialog.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule
  ],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit, AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns: string[] = [
    'sku',
    'name',
    'category',
    'price',
    'stock',
    'status',
    'iva',
    'updatedAt',
    'actions'
  ];
  readonly dataSource = new MatTableDataSource<Product>([]);
  readonly categories = this.productService.getCategories();

  loading = true;

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (product, filter) => {
      const normalizedFilter = filter.trim().toLowerCase();
      const haystack = [
        product.name,
        product.sku,
        product.category,
        product.supplier,
        product.status
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedFilter);
    };

    this.dataSource.sortingDataAccessor = (product, property) => {
      switch (property) {
        case 'price':
          return product.price;
        case 'stock':
          return product.stock;
        case 'updatedAt':
          return new Date(product.updatedAt).getTime();
        default:
          return `${product[property as keyof Product] ?? ''}`.toLowerCase();
      }
    };
  }

  ngOnInit(): void {
    this.productService.getProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((products) => {
        this.dataSource.data = products;
        this.loading = false;
        this.attachTableHelpers();
      });
  }

  ngAfterViewInit(): void {
    this.attachTableHelpers();
  }

  get activeProductsCount(): number {
    return this.dataSource.data.filter((product) => product.status === 'active').length;
  }

  get taxableProductsCount(): number {
    return this.dataSource.data.filter((product) => product.iva).length;
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
    this.paginator?.firstPage();
  }

  openCreateDialog(): void {
    this.dialog.open(ProductFormDialogComponent, {
      width: '720px',
      data: {
        mode: 'create',
        categories: this.categories
      }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: ProductPayload) => {
        if (!result) {
          return;
        }

        this.productService.createProduct(result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.openSnackBar('Producto creado correctamente.');
          });
      });
  }

  openEditDialog(product: Product): void {
    this.dialog.open(ProductFormDialogComponent, {
      width: '720px',
      data: {
        mode: 'edit',
        product,
        categories: this.categories
      }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: ProductPayload) => {
        if (!result) {
          return;
        }

        this.productService.updateProduct(product.id, result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.openSnackBar('Producto actualizado correctamente.');
          });
      });
  }

  openDeleteDialog(product: Product): void {
    this.dialog.open(ProductDeleteDialogComponent, {
      width: '420px',
      data: product
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.productService.deleteProduct(product.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.openSnackBar('Producto eliminado correctamente.');
          });
      });
  }

  private attachTableHelpers(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private openSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 2500
    });
  }

}
